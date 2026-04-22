import { createAdminClient } from "@/lib/supabase/admin";

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minPlanPrice: number;
  expiresAt: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  isActive: boolean;
  stripeCouponId: string | null;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  partnerId: string;
  planSlug: string;
  discount: number;
  createdAt: string;
}

/* ── Mapping ─────────────────────────────────── */

function mapDbCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    description: row.description as string | null,
    type: row.type as CouponType,
    value: row.value as number,
    minPlanPrice: row.min_plan_price as number,
    expiresAt: row.expires_at as string | null,
    maxRedemptions: row.max_redemptions as number | null,
    timesRedeemed: row.times_redeemed as number,
    isActive: row.is_active as boolean,
    stripeCouponId: row.stripe_coupon_id as string | null,
    createdAt: row.created_at as string,
  };
}

/* ── Queries ─────────────────────────────────── */

export async function getAllCoupons(): Promise<Coupon[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbCoupon);
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .eq("is_active", true)
    .maybeSingle();

  return data ? mapDbCoupon(data) : null;
}

/**
 * Validate a coupon code and return the discount amount in cents.
 * Returns { valid: false, reason } or { valid: true, coupon, discountCents }.
 */
export async function validateCoupon(
  code: string,
  planPriceCents: number,
): Promise<
  | { valid: true; coupon: Coupon; discountCents: number }
  | { valid: false; reason: string }
> {
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return { valid: false, reason: "Invalid coupon code." };
  }

  if (!coupon.isActive) {
    return { valid: false, reason: "This coupon is no longer active." };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, reason: "This coupon has expired." };
  }

  if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { valid: false, reason: "This coupon has reached its redemption limit." };
  }

  if (planPriceCents < coupon.minPlanPrice) {
    return { valid: false, reason: "This coupon cannot be applied to this plan." };
  }

  let discountCents: number;
  if (coupon.type === "percentage") {
    discountCents = Math.round((planPriceCents * coupon.value) / 100);
  } else {
    discountCents = Math.min(coupon.value, planPriceCents);
  }

  return { valid: true, coupon, discountCents };
}

/**
 * Atomically record a coupon redemption and increment the counter.
 * Uses an RPC function to perform an atomic conditional increment:
 *   UPDATE coupons SET times_redeemed = times_redeemed + 1
 *   WHERE id = ? AND (max_redemptions IS NULL OR times_redeemed < max_redemptions)
 * Returns true if the redemption succeeded, false if the coupon was
 * already fully redeemed (race condition safe).
 */
export async function redeemCoupon(
  couponId: string,
  partnerId: string,
  planSlug: string,
  discountCents: number,
): Promise<boolean> {
  const admin = createAdminClient();

  // Atomic conditional increment via Supabase RPC.
  // The DB function `increment_coupon_redemption` runs:
  //   UPDATE coupons
  //   SET times_redeemed = times_redeemed + 1
  //   WHERE id = p_coupon_id
  //     AND (max_redemptions IS NULL OR times_redeemed < max_redemptions)
  //   RETURNING id;
  // It returns the number of rows affected (0 or 1).
  const { data: rowsAffected, error: rpcError } = await admin.rpc(
    "increment_coupon_redemption",
    { p_coupon_id: couponId },
  );

  // If the RPC returns 0 affected rows, the coupon was already fully redeemed.
  if (rpcError || rowsAffected === 0) {
    return false;
  }

  // Record the redemption details
  const { error: insertError } = await admin.from("coupon_redemptions").insert({
    coupon_id: couponId,
    partner_id: partnerId,
    plan_slug: planSlug,
    discount: discountCents,
  });

  if (insertError) {
    // Rollback: decrement the counter since we already incremented it
    console.error("[redeemCoupon] redemption insert failed, rolling back counter:", insertError);
    try {
      const { data: coupon } = await admin.from("coupons").select("times_redeemed").eq("id", couponId).single();
      if (coupon && typeof coupon.times_redeemed === "number" && coupon.times_redeemed > 0) {
        await admin.from("coupons").update({ times_redeemed: coupon.times_redeemed - 1 }).eq("id", couponId);
      }
    } catch { /* best-effort rollback */ }
    return false;
  }

  return true;
}
