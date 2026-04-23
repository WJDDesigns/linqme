"use server";

import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

interface CouponInput {
  code: string;
  description?: string;
  type: "percentage" | "fixed";
  value: number;
  expiresAt?: string;
  maxRedemptions?: number;
}

export async function createCouponAction(input: CouponInput) {
  await requireSuperadmin();

  const validTypes = ["percentage", "fixed"] as const;
  if (!validTypes.includes(input.type as (typeof validTypes)[number])) {
    throw new Error("Invalid coupon type. Must be 'percentage' or 'fixed'.");
  }

  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("Coupon code is required.");
  if (input.value <= 0) throw new Error("Discount value must be positive.");
  if (input.type === "percentage" && input.value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  const admin = createAdminClient();

  // Check for duplicates
  const { data: existing } = await admin
    .from("coupons")
    .select("id")
    .ilike("code", code)
    .maybeSingle();

  if (existing) throw new Error("A coupon with this code already exists.");

  // Create Stripe coupon -- required for checkout to work
  let stripeCouponId: string;
  try {
    const stripeCoupon = await stripe.coupons.create({
      ...(input.type === "percentage"
        ? { percent_off: input.value }
        : { amount_off: input.value, currency: "usd" }),
      duration: "once",
      name: code,
      ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
      ...(input.expiresAt
        ? { redeem_by: Math.floor(new Date(input.expiresAt).getTime() / 1000) }
        : {}),
      metadata: { linqme_code: code },
    });
    stripeCouponId = stripeCoupon.id;
  } catch (err) {
    console.error("[billing] Failed to create Stripe coupon:", err);
    const msg = err instanceof Error ? err.message : "Unknown Stripe error";
    throw new Error(`Failed to create coupon in Stripe: ${msg}`);
  }

  await admin.from("coupons").insert({
    code,
    description: input.description || null,
    type: input.type,
    value: input.value,
    expires_at: input.expiresAt || null,
    max_redemptions: input.maxRedemptions || null,
    stripe_coupon_id: stripeCouponId,
    is_active: true,
  });

  revalidatePath("/dashboard/admin/billing/coupons");
  return { success: true };
}

export async function toggleCouponAction(couponId: string, isActive: boolean) {
  await requireSuperadmin();
  const admin = createAdminClient();

  // Get the Stripe coupon ID so we can sync the active state
  const { data: coupon } = await admin
    .from("coupons")
    .select("stripe_coupon_id")
    .eq("id", couponId)
    .maybeSingle();

  // Stripe doesn't support re-activating deleted coupons, so we delete/recreate
  // For deactivating: delete the Stripe coupon so it can't be used
  // For re-activating: the checkout fallback will auto-create if missing
  if (coupon?.stripe_coupon_id && !isActive) {
    try {
      await stripe.coupons.del(coupon.stripe_coupon_id);
    } catch {
      // May already be deleted
    }
    await admin
      .from("coupons")
      .update({ is_active: isActive, stripe_coupon_id: null, updated_at: new Date().toISOString() })
      .eq("id", couponId);
  } else {
    await admin
      .from("coupons")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", couponId);
  }

  revalidatePath("/dashboard/admin/billing/coupons");
  return { success: true };
}

/**
 * Update a coupon's discount value. Stripe coupons are immutable, so we
 * delete the old one and create a new one with the updated values.
 */
export async function updateCouponAction(
  couponId: string,
  input: { type?: "percentage" | "fixed"; value?: number; description?: string; expiresAt?: string | null; maxRedemptions?: number | null },
) {
  await requireSuperadmin();
  const admin = createAdminClient();

  const { data: coupon } = await admin
    .from("coupons")
    .select("*")
    .eq("id", couponId)
    .single();

  if (!coupon) throw new Error("Coupon not found.");

  const newType = input.type ?? coupon.type;
  const newValue = input.value ?? coupon.value;

  if (newValue <= 0) throw new Error("Discount value must be positive.");
  if (newType === "percentage" && newValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  // If type or value changed, we need to replace the Stripe coupon
  const discountChanged = newType !== coupon.type || newValue !== coupon.value;

  let newStripeCouponId = coupon.stripe_coupon_id;

  if (discountChanged) {
    // Delete old Stripe coupon
    if (coupon.stripe_coupon_id) {
      try {
        await stripe.coupons.del(coupon.stripe_coupon_id);
      } catch {
        // May already be deleted
      }
    }

    // Create new Stripe coupon with updated values
    const expiresAt = input.expiresAt !== undefined ? input.expiresAt : coupon.expires_at;
    const maxRedemptions = input.maxRedemptions !== undefined ? input.maxRedemptions : coupon.max_redemptions;

    try {
      const newStripeCoupon = await stripe.coupons.create({
        ...(newType === "percentage"
          ? { percent_off: newValue }
          : { amount_off: newValue, currency: "usd" }),
        duration: "once",
        name: coupon.code,
        ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
        ...(expiresAt
          ? { redeem_by: Math.floor(new Date(expiresAt).getTime() / 1000) }
          : {}),
        metadata: { linqme_code: coupon.code },
      });
      newStripeCouponId = newStripeCoupon.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown Stripe error";
      throw new Error(`Failed to update coupon in Stripe: ${msg}`);
    }
  }

  // Update in DB
  await admin
    .from("coupons")
    .update({
      type: newType,
      value: newValue,
      description: input.description !== undefined ? (input.description || null) : coupon.description,
      expires_at: input.expiresAt !== undefined ? (input.expiresAt || null) : coupon.expires_at,
      max_redemptions: input.maxRedemptions !== undefined ? input.maxRedemptions : coupon.max_redemptions,
      stripe_coupon_id: newStripeCouponId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", couponId);

  revalidatePath("/dashboard/admin/billing/coupons");
  return { success: true };
}

export async function deleteCouponAction(couponId: string) {
  await requireSuperadmin();
  const admin = createAdminClient();

  // Get Stripe coupon ID before deleting
  const { data: coupon } = await admin
    .from("coupons")
    .select("stripe_coupon_id")
    .eq("id", couponId)
    .maybeSingle();

  // Delete from Stripe
  if (coupon?.stripe_coupon_id) {
    try {
      await stripe.coupons.del(coupon.stripe_coupon_id);
    } catch {
      // Stripe coupon may already be deleted
    }
  }

  await admin.from("coupons").delete().eq("id", couponId);

  revalidatePath("/dashboard/admin/billing/coupons");
  return { success: true };
}
