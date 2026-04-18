"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentAccount, getPartnerMemberContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPartnerInvite } from "@/lib/partner-invites";

/**
 * Resolve which partner the current user "owns" for team management.
 * - Agency owners: their root account id
 * - Partner owners: their partner id
 * - Partner members with owner role: their partner id
 */
async function resolveTeamPartnerId(): Promise<string | null> {
  const session = await requireSession();

  // Check partner_member context first
  const pmCtx = await getPartnerMemberContext(session.userId);
  if (pmCtx) return pmCtx.partnerId;

  // Otherwise use the root account
  const account = await getCurrentAccount(session.userId);
  return account?.id ?? null;
}

async function requireOwnership(partnerId: string) {
  const session = await requireSession();
  if (session.role === "superadmin") return;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("partner_members")
    .select("role")
    .eq("partner_id", partnerId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!membership || membership.role !== "partner_owner") {
    throw new Error("Not authorized to manage this team.");
  }
}

export async function sendTeamInviteAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const partnerId = await resolveTeamPartnerId();
  if (!partnerId) return { ok: false, error: "No account found." };

  await requireOwnership(partnerId);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required." };

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("name")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner) return { ok: false, error: "Partner not found." };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.userId)
    .maybeSingle();

  const result = await createPartnerInvite({
    email,
    partnerId,
    partnerName: partner.name,
    invitedByUserId: session.userId,
    invitedByName: profile?.full_name || profile?.email || "Admin",
  });

  if (result.ok) {
    revalidatePath("/dashboard/team");
    revalidatePath(`/dashboard/partners/${partnerId}`);
  }

  return result;
}

export async function revokeTeamInviteAction(
  inviteId: string,
): Promise<{ ok: boolean; error?: string }> {
  const partnerId = await resolveTeamPartnerId();
  if (!partnerId) return { ok: false, error: "No account found." };
  await requireOwnership(partnerId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("invites")
    .delete()
    .eq("id", inviteId)
    .eq("partner_id", partnerId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function removeTeamMemberAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const partnerId = await resolveTeamPartnerId();
  if (!partnerId) return { ok: false, error: "No account found." };
  await requireOwnership(partnerId);

  if (userId === session.userId) {
    return { ok: false, error: "You cannot remove yourself." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("partner_members")
    .delete()
    .eq("partner_id", partnerId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/team");
  return { ok: true };
}
