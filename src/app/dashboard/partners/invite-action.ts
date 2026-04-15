"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPartnerInvite } from "@/lib/partner-invites";

/**
 * Create a new partner AND send an invite email in one step.
 * Called from the Partners list page.
 */
export async function inviteNewPartnerAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) return { ok: false, error: "No account found." };

  // Only paid tier can invite partners
  if (account.planTier === "free") {
    return { ok: false, error: "Upgrade to a paid plan to invite partners." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const partnerName = String(formData.get("partnerName") ?? "").trim();

  if (!email) return { ok: false, error: "Email is required." };
  if (!partnerName) return { ok: false, error: "Partner name is required." };

  // Generate a slug from the partner name
  const slug = partnerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (!slug) return { ok: false, error: "Could not generate a valid URL from that name." };

  const admin = createAdminClient();

  // Check slug availability
  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: `The slug "${slug}" is already taken. Try a different name.` };
  }

  // Create the partner as a sub-partner under the user's account
  const { data: newPartner, error: createError } = await admin
    .from("partners")
    .insert({
      slug,
      name: partnerName,
      parent_partner_id: account.id,
      created_by: session.userId,
      primary_color: "#696cf8",
      accent_color: "#3cddc7",
    })
    .select("id")
    .single();

  if (createError || !newPartner) {
    return { ok: false, error: createError?.message ?? "Failed to create partner." };
  }

  // Get inviter profile
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  // Send the invite
  const inviteResult = await createPartnerInvite({
    email,
    partnerId: newPartner.id,
    partnerName,
    invitedByUserId: session.userId,
    invitedByName: profile?.full_name || profile?.email || "Admin",
  });

  if (!inviteResult.ok) {
    // Partner was created but invite failed — still ok, they can resend from manage page
    revalidatePath("/dashboard/partners");
    return { ok: true, error: `Partner created but invite failed: ${inviteResult.error}` };
  }

  // Log event
  await admin.from("events").insert({
    partner_id: newPartner.id,
    actor_id: session.userId,
    name: "partner_invited",
    props: { email, partner_name: partnerName },
  });

  revalidatePath("/dashboard/partners");
  return { ok: true };
}
