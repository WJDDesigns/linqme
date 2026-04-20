import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

/* ── Plan tier ↔ Stripe price mapping ─────────────────────── */

export type BillingTier = "free" | "starter" | "pro" | "agency" | "standard" | "enterprise";

export interface PlanConfig {
  tier: BillingTier;
  name: string;
  /** Monthly price in cents (0 = free) */
  priceMonthly: number;
  /** Stripe price ID — set after products are created, or from env */
  stripePriceId: string | null;
  submissionsMonthlyLimit: number | null; // null = unlimited
  features: string[];
}

/**
 * Plan definitions. Stripe price IDs are set via env vars so the same
 * code works across dev / staging / production Stripe accounts.
 */
export const PLANS: Record<"free" | "starter" | "pro" | "agency", PlanConfig> = {
  free: {
    tier: "free",
    name: "Free",
    priceMonthly: 0,
    stripePriceId: null,
    submissionsMonthlyLimit: 10,
    features: [
      "Your own branded workspace",
      "1 form",
      "Unlimited form fields",
      "File uploads",
      "100 MB storage",
      "10 submissions / month",
    ],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    priceMonthly: 3900, // $39
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
    submissionsMonthlyLimit: 50,
    features: [
      "Everything in Free",
      "Up to 5 forms",
      "50 submissions / month",
      "1 GB storage",
      "CSV & PDF exports",
      "Email support",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceMonthly: 9900, // $99
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    submissionsMonthlyLimit: null,
    features: [
      "Everything in Starter",
      "Unlimited forms",
      "Unlimited submissions",
      "100 GB storage",
      "Full white-labeling",
      "Custom domain",
    ],
  },
  agency: {
    tier: "agency",
    name: "Agency",
    priceMonthly: 24900, // $249
    stripePriceId: process.env.STRIPE_PRICE_AGENCY ?? null,
    submissionsMonthlyLimit: null,
    features: [
      "Everything in Pro",
      "Partner management",
      "500 GB storage",
      "Priority 24/7 support",
      "SLA guarantee",
    ],
  },
};

/** Map old plan_tier enum values to current billing tiers */
export function mapLegacyTier(dbTier: string): BillingTier {
  switch (dbTier) {
    case "starter":
    case "standard":
      return "starter";
    case "paid":
      return "starter";
    case "pro":
      return "pro";
    case "unlimited":
    case "enterprise":
    case "agency":
      return "agency";
    default:
      return "free";
  }
}

/** Map billing tier back to the DB plan_tier enum */
export function tierToDbEnum(tier: BillingTier | string): string {
  switch (tier) {
    case "starter":
    case "standard":
      return "starter";
    case "pro":
      return "pro";
    case "enterprise":
    case "agency":
      return "agency";
    default:
      return "free";
  }
}

/**
 * Create Stripe products and prices if they don't exist yet.
 * Idempotent — only creates if the env-based price IDs are missing.
 * Returns the price IDs that should be saved to env vars.
 */
export async function ensureStripeProducts(): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = { free: null, starter: null, pro: null, agency: null };

  for (const plan of [PLANS.starter, PLANS.pro, PLANS.agency]) {
    if (plan.stripePriceId) {
      results[plan.tier] = plan.stripePriceId;
      continue;
    }

    // Search for existing product by metadata
    const existing = await stripe.products.search({
      query: `metadata["linqme_tier"]:"${plan.tier}"`,
    });

    let product: Stripe.Product;
    if (existing.data.length > 0) {
      product = existing.data[0];
    } else {
      product = await stripe.products.create({
        name: `linqme ${plan.name}`,
        metadata: { linqme_tier: plan.tier },
      });
    }

    // Look for an active monthly price at the correct amount
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: "recurring",
    });

    let price = prices.data.find(
      (p) =>
        p.unit_amount === plan.priceMonthly &&
        p.recurring?.interval === "month",
    );

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceMonthly,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { linqme_tier: plan.tier },
      });
    }

    results[plan.tier] = price.id;
  }

  return results;
}

/**
 * Get or create a Stripe customer for a partner.
 */
export async function getOrCreateCustomer(
  partnerId: string,
  partnerName: string,
  email?: string,
): Promise<string> {
  // Search by metadata first
  const existing = await stripe.customers.search({
    query: `metadata["linqme_partner_id"]:"${partnerId}"`,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    name: partnerName,
    email: email ?? undefined,
    metadata: { linqme_partner_id: partnerId },
  });

  return customer.id;
}
