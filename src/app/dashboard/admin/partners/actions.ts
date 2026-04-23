"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logInfo, logError } from "@/lib/system-log";

const VALID_TIERS = ["free", "starter", "pro", "agency"] as const;

/**
 * Change a partner's plan tier (superadmin only).
 * This is an admin override -- it directly sets the plan_tier in the DB
 * without going through Stripe. Use for manual promotions/demotions.
 */
export async function changePartnerTierAction(
  partnerId: string,
  newTier: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSuperadmin();

  if (!VALID_TIERS.includes(newTier as (typeof VALID_TIERS)[number])) {
    return { ok: false, error: `Invalid tier: ${newTier}` };
  }

  const admin = createAdminClient();

  // Verify partner exists
  const { data: partner } = await admin
    .from("partners")
    .select("id, name, plan_tier")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) return { ok: false, error: "Partner not found." };

  if (partner.plan_tier === newTier) {
    return { ok: true }; // Already on this tier
  }

  // Get the plan details for limits
  const { data: plan } = await admin
    .from("plans")
    .select("submissions_monthly_limit, forms_limit")
    .eq("slug", newTier)
    .maybeSingle();

  // Update the partner's tier and limits
  const { error: updateError } = await admin
    .from("partners")
    .update({
      plan_tier: newTier,
      submissions_monthly_limit: plan?.submissions_monthly_limit ?? null,
    })
    .eq("id", partnerId);

  if (updateError) {
    logError(`Tier change failed: ${updateError.message}`, { category: "billing", partnerId, metadata: { from: partner.plan_tier, to: newTier } });
    return { ok: false, error: updateError.message };
  }

  logInfo(`Tier changed: ${partner.plan_tier} -> ${newTier}`, { category: "billing", partnerId, metadata: { partnerName: partner.name, from: partner.plan_tier, to: newTier } });

  // Log the tier change as an event
  await admin.from("events").insert({
    partner_id: partnerId,
    name: "plan_tier_changed",
    props: {
      from: partner.plan_tier,
      to: newTier,
      method: "admin_override",
    },
  });

  revalidatePath("/dashboard/admin/partners");
  return { ok: true };
}
