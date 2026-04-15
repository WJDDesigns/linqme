"use server";

import { redirect } from "next/navigation";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";
import { getPlanBySlug } from "@/lib/plans";

/**
 * Create a Stripe Checkout session for upgrading to a paid plan.
 * Now reads the plan from the DB instead of hardcoded config.
 */
export async function createCheckoutAction(planSlug: string) {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) throw new Error("No account found");

  const plan = await getPlanBySlug(planSlug);
  if (!plan) throw new Error("Plan not found");
  if (!plan.stripePriceId) throw new Error("No Stripe price configured for this plan. Ask your admin to set up Stripe.");

  // Get or create Stripe customer
  const customerId = await getOrCreateCustomer(account.id, account.name, session.email);

  // Save Stripe customer ID to partner if not already there
  const admin = createAdminClient();
  await admin
    .from("partners")
    .update({ stripe_customer_id: customerId })
    .eq("id", account.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?upgraded=true`,
    cancel_url: `${appUrl}/dashboard/billing`,
    subscription_data: {
      metadata: {
        sitelaunch_partner_id: account.id,
        sitelaunch_tier: plan.slug,
      },
    },
    metadata: {
      sitelaunch_partner_id: account.id,
    },
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  }
}

/**
 * Switch between paid plans (upgrade or downgrade) using Stripe proration.
 * - If user has an active subscription: updates it in-place with proration
 * - If user has no subscription (free→paid): falls through to checkout
 * Stripe automatically credits unused time on the old plan and charges
 * the prorated amount for the new plan.
 */
export async function switchPlanAction(
  targetSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found" };

  const targetPlan = await getPlanBySlug(targetSlug);
  if (!targetPlan) return { ok: false, error: "Plan not found" };
  if (!targetPlan.stripePriceId)
    return { ok: false, error: "No Stripe price configured for this plan." };

  const admin = createAdminClient();

  // Find active subscription
  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id, stripe_price_id")
    .eq("partner_id", account.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    // No active subscription — redirect to checkout for new subscription
    await createCheckoutAction(targetSlug);
    return { ok: true }; // won't reach here due to redirect
  }

  try {
    // Retrieve the Stripe subscription to get the subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(activeSub.id);
    const subscriptionItemId = stripeSub.items.data[0]?.id;

    if (!subscriptionItemId) {
      return { ok: false, error: "Could not find subscription item." };
    }

    // Update the subscription with proration
    await stripe.subscriptions.update(activeSub.id, {
      items: [
        {
          id: subscriptionItemId,
          price: targetPlan.stripePriceId,
        },
      ],
      proration_behavior: "create_prorations",
      metadata: {
        sitelaunch_partner_id: account.id,
        sitelaunch_tier: targetSlug,
      },
    });

    // The webhook will handle syncing the new tier to the DB
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to switch plan";
    return { ok: false, error: message };
  }
}

/**
 * Cancel subscription at end of billing period (paid → free).
 * The user keeps access until the current period ends, then the
 * webhook will downgrade them to free when `subscription.deleted` fires.
 */
export async function cancelSubscriptionAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found" };

  const admin = createAdminClient();

  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("partner_id", account.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    return { ok: false, error: "No active subscription found." };
  }

  try {
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: true,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    return { ok: false, error: message };
  }
}

/**
 * Re-activate a subscription that was set to cancel at period end.
 */
export async function reactivateSubscriptionAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found" };

  const admin = createAdminClient();

  const { data: activeSub } = await admin
    .from("subscriptions")
    .select("id, cancel_at_period_end")
    .eq("partner_id", account.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    return { ok: false, error: "No active subscription found." };
  }

  if (!activeSub.cancel_at_period_end) {
    return { ok: false, error: "Subscription is not set to cancel." };
  }

  try {
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: false,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reactivate subscription";
    return { ok: false, error: message };
  }
}

/**
 * Open Stripe Customer Portal for managing subscription, payment methods, invoices.
 */
export async function openCustomerPortalAction() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) throw new Error("No account found");

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("stripe_customer_id")
    .eq("id", account.id)
    .maybeSingle();

  if (!partner?.stripe_customer_id) {
    throw new Error("No Stripe customer found. Please subscribe to a plan first.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: partner.stripe_customer_id,
    return_url: `${appUrl}/dashboard/billing`,
  });

  redirect(portalSession.url);
}
