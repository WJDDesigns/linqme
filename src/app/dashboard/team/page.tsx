import { requireSession, getCurrentAccount, getPartnerMemberContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import TeamManager from "./TeamManager";

export default async function TeamPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Team</h1>
        <p className="text-sm text-on-surface-variant mt-2">No workspace associated with your account.</p>
      </div>
    );
  }

  // Determine which partner the current user manages
  const pmCtx = await getPartnerMemberContext(session.userId);
  const partnerId = pmCtx?.partnerId ?? account.id;

  const admin = createAdminClient();

  // Get partner info
  const { data: partner } = await admin
    .from("partners")
    .select("id, name, slug")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Team</h1>
        <p className="text-sm text-on-surface-variant mt-2">Partner not found.</p>
      </div>
    );
  }

  // Get members
  const { data: memberRows } = await admin
    .from("partner_members")
    .select("user_id, role, created_at, profiles ( full_name, email, avatar_url )")
    .eq("partner_id", partnerId);

  const members = (memberRows ?? []).map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id as string,
      role: m.role as string,
      email: (prof as { email?: string })?.email ?? "",
      full_name: (prof as { full_name?: string })?.full_name ?? null,
      avatar_url: (prof as { avatar_url?: string })?.avatar_url ?? null,
      created_at: m.created_at as string,
    };
  });

  // Get pending invites
  const { data: inviteRows } = await admin
    .from("invites")
    .select("id, email, accepted_at, expires_at, created_at")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  const invites = (inviteRows ?? []).map((i) => ({
    id: i.id as string,
    email: i.email as string,
    accepted_at: i.accepted_at as string | null,
    expires_at: i.expires_at as string,
    created_at: i.created_at as string,
  }));

  // Check if current user is the owner (can manage team)
  const isOwner =
    session.role === "superadmin" ||
    members.some((m) => m.user_id === session.userId && m.role === "partner_owner");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-headline tracking-tight text-on-surface">Team</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your team members for {partner.name}.
        </p>
      </header>

      <TeamManager
        partnerName={partner.name}
        members={members}
        invites={invites}
        isOwner={isOwner}
        currentUserId={session.userId}
      />
    </div>
  );
}
