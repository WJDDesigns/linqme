"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { sendTeamInviteAction, revokeTeamInviteAction, removeTeamMemberAction } from "./actions";

interface Member {
  user_id: string;
  role: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

interface Props {
  partnerName: string;
  members: Member[];
  invites: Invite[];
  isOwner: boolean;
  currentUserId: string;
}

function roleLabel(role: string) {
  switch (role) {
    case "partner_owner": return "Owner";
    case "partner_member": return "Member";
    case "superadmin": return "Admin";
    default: return role;
  }
}

function roleColor(role: string) {
  switch (role) {
    case "partner_owner": return "bg-primary/10 text-primary border-primary/20";
    case "superadmin": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default: return "bg-surface-container-high text-on-surface-variant border-outline-variant/10";
  }
}

export default function TeamManager({ partnerName, members, invites, isOwner, currentUserId }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const pendingInvites = invites.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date());
  const owners = members.filter((m) => m.role === "partner_owner" || m.role === "superadmin");
  const teamMembers = members.filter((m) => m.role === "partner_member");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setMessage(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", email.trim());
      const result = await sendTeamInviteAction(fd);
      if (result.ok) {
        setMessage({ type: "ok", text: `Invite sent to ${email}` });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to send invite." });
      }
      router.refresh();
    });
  }

  function handleRevoke(inviteId: string) {
    startTransition(async () => {
      const result = await revokeTeamInviteAction(inviteId);
      if (!result.ok) setMessage({ type: "error", text: result.error ?? "Failed to revoke." });
      router.refresh();
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeTeamMemberAction(userId);
      if (result.ok) {
        setConfirmRemove(null);
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to remove." });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite form — only for owners */}
      {isOwner && (
        <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
          <h2 className="text-lg font-bold font-headline text-on-surface mb-1">Invite a Team Member</h2>
          <p className="text-sm text-on-surface-variant/60 mb-4">
            Team members can view entries, manage branding, and help run {partnerName}. They cannot edit forms.
          </p>

          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team@example.com"
              required
              className="flex-1 rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300 disabled:opacity-50 shrink-0 flex items-center gap-2"
            >
              {isPending ? (
                <i className="fa-solid fa-spinner animate-spin" />
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane text-xs" />
                  Send Invite
                </>
              )}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                message.type === "ok"
                  ? "bg-tertiary/10 border border-tertiary/20 text-tertiary"
                  : "bg-error/10 border border-error/20 text-error"
              }`}
            >
              <i className={`fa-solid ${message.type === "ok" ? "fa-check-circle" : "fa-circle-exclamation"} mr-2`} />
              {message.text}
            </div>
          )}
        </section>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
          <h2 className="text-lg font-bold font-headline text-on-surface mb-4">
            Pending Invites
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingInvites.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <i className="fa-solid fa-clock text-sm text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{inv.email}</p>
                    <p className="text-xs text-on-surface-variant/40">
                      Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={isPending}
                    className="text-xs text-on-surface-variant/40 hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-error/5"
                    title="Revoke invite"
                  >
                    <i className="fa-solid fa-xmark mr-1" />
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team members */}
      <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
        <h2 className="text-lg font-bold font-headline text-on-surface mb-4">
          Team Members
          <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {members.length}
          </span>
        </h2>

        {members.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-user-group text-primary text-lg" />
            </div>
            <p className="text-sm text-on-surface-variant/60">No team members yet. Invite someone to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Owners first, then members */}
            {[...owners, ...teamMembers].map((m) => {
              const isYou = m.user_id === currentUserId;
              const canRemove = isOwner && m.role === "partner_member" && !isYou;

              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    {m.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {(m.full_name || m.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-on-surface">
                          {m.full_name || m.email}
                        </p>
                        {isYou && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/40 bg-surface-container-high px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant/40">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleColor(m.role)}`}>
                      {roleLabel(m.role)}
                    </span>

                    {canRemove && confirmRemove !== m.user_id && (
                      <button
                        onClick={() => setConfirmRemove(m.user_id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-all"
                        title="Remove member"
                      >
                        <i className="fa-solid fa-user-minus text-xs" />
                      </button>
                    )}

                    {canRemove && confirmRemove === m.user_id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemove(m.user_id)}
                          disabled={isPending}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-error rounded-lg hover:bg-error/80 transition-all disabled:opacity-50"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-2 py-1 text-[10px] font-bold border border-outline-variant/15 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Permissions info */}
      <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
        <h2 className="text-lg font-bold font-headline text-on-surface mb-4">Permissions</h2>
        <div className="space-y-3">
          {[
            { icon: "fa-eye", label: "View Entries", desc: "Team members can see all form submissions", roles: "Owner, Member" },
            { icon: "fa-palette", label: "Manage Branding", desc: "Update logo, colors, and domain settings", roles: "Owner, Member" },
            { icon: "fa-user-plus", label: "Manage Team", desc: "Invite and remove team members", roles: "Owner only" },
            { icon: "fa-pen-ruler", label: "Edit Forms", desc: "Create and modify intake forms", roles: "Agency only" },
          ].map((perm) => (
            <div key={perm.label} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-container-low/40">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <i className={`fa-solid ${perm.icon} text-xs text-primary`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface">{perm.label}</p>
                <p className="text-xs text-on-surface-variant/50">{perm.desc}</p>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider shrink-0 mt-1">
                {perm.roles}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
