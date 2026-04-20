"use client";

import { useState, useTransition } from "react";
import { sendAgencyInviteAction, resendInviteAction, revokeInviteAction } from "./actions";
import type { CouponConfig } from "./actions";

interface Invite {
  id: string;
  email: string;
  name: string | null;
  coupon_code: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

interface PlanOption {
  slug: string;
  name: string;
  priceMonthly: number;
}

export default function InvitesManager({ invites: initialInvites, plans }: { invites: Invite[]; plans: PlanOption[] }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("20");
  const [minPlanSlug, setMinPlanSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const handleSend = () => {
    if (!email.trim()) return;
    setMessage(null);

    const numValue = parseFloat(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      setMessage({ type: "error", text: "Enter a valid discount amount." });
      return;
    }

    const couponConfig: CouponConfig = {
      type: discountType,
      value: discountType === "fixed" ? Math.round(numValue * 100) : numValue,
      minPlanSlug,
    };

    startTransition(async () => {
      const res = await sendAgencyInviteAction(email.trim(), name.trim() || undefined, couponConfig);
      if (res.ok) {
        setMessage({ type: "success", text: `Invitation sent to ${email}!` });
        setEmail("");
        setName("");
        setDiscountValue("20");
        setDiscountType("percentage");
        setMinPlanSlug("");
      } else {
        setMessage({ type: "error", text: res.error ?? "Failed to send invite." });
      }
    });
  };

  const handleResend = (id: string) => {
    setActionPending(id);
    startTransition(async () => {
      const res = await resendInviteAction(id);
      if (res.ok) {
        setMessage({ type: "success", text: "Invite resent successfully." });
      } else {
        setMessage({ type: "error", text: res.error ?? "Failed to resend." });
      }
      setActionPending(null);
    });
  };

  const handleRevoke = (id: string) => {
    setActionPending(id);
    startTransition(async () => {
      const res = await revokeInviteAction(id);
      if (res.ok) {
        setMessage({ type: "success", text: "Invite revoked." });
      } else {
        setMessage({ type: "error", text: res.error ?? "Failed to revoke." });
      }
      setActionPending(null);
    });
  };

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    revoked: "bg-red-500/10 text-red-400 border-red-500/20",
    expired: "bg-on-surface-variant/10 text-on-surface-variant/60 border-on-surface-variant/20",
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/10 text-on-surface text-sm placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all";

  return (
    <div className="space-y-6">
      {/* Send invite form */}
      <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
        <h2 className="text-lg font-bold font-headline text-on-surface mb-1">
          Send Invitation
        </h2>
        <p className="text-sm text-on-surface-variant/60 mb-5">
          Invite an agency owner to sign up. A unique coupon code will be auto-generated and included in the email.
        </p>

        {/* Row 1: Email + Name */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-on-surface-variant/60 mb-1.5">
              Email address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agency@example.com"
              className={inputClass}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-xs font-semibold text-on-surface-variant/60 mb-1.5">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={inputClass}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
          </div>
        </div>

        {/* Row 2: Coupon config */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="sm:w-44">
            <label className="block text-xs font-semibold text-on-surface-variant/60 mb-1.5">
              Discount type
            </label>
            <div className="flex rounded-xl overflow-hidden border border-outline-variant/10">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  discountType === "percentage"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high/60"
                }`}
              >
                <i className="fa-solid fa-percent text-xs mr-1.5" />
                Percent
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                  discountType === "fixed"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high/40 text-on-surface-variant hover:bg-surface-container-high/60"
                }`}
              >
                <i className="fa-solid fa-dollar-sign text-xs mr-1.5" />
                Flat fee
              </button>
            </div>
          </div>

          <div className="sm:w-36">
            <label className="block text-xs font-semibold text-on-surface-variant/60 mb-1.5">
              {discountType === "percentage" ? "Discount %" : "Amount ($)"}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={discountType === "percentage" ? 100 : undefined}
                step={discountType === "fixed" ? "0.01" : "1"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className={inputClass}
                placeholder={discountType === "percentage" ? "20" : "10.00"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/40 font-bold">
                {discountType === "percentage" ? "%" : "USD"}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-on-surface-variant/60 mb-1.5">
              Applies to plan
            </label>
            <select
              value={minPlanSlug}
              onChange={(e) => setMinPlanSlug(e.target.value)}
              className={inputClass}
            >
              <option value="">All plans</option>
              {plans.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} (${(p.priceMonthly / 100).toFixed(0)}/mo)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              onClick={handleSend}
              disabled={isPending || !email.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <i className="fa-solid fa-spinner fa-spin text-xs" />
              ) : (
                <i className="fa-solid fa-paper-plane text-xs" />
              )}
              Send Invite
            </button>
          </div>
        </div>

        {/* Preview line */}
        <div className="text-xs text-on-surface-variant/40 flex items-center gap-1.5">
          <i className="fa-solid fa-tag text-primary/50" />
          Coupon:{" "}
          <span className="font-semibold text-on-surface-variant/60">
            {discountType === "percentage"
              ? `${discountValue || 0}% off`
              : `$${discountValue || 0} off`}
          </span>
          {minPlanSlug && (
            <>
              {" "}on{" "}
              <span className="font-semibold text-on-surface-variant/60">
                {plans.find((p) => p.slug === minPlanSlug)?.name ?? minPlanSlug}+
              </span>
            </>
          )}
          {!minPlanSlug && <span> on all plans</span>}
        </div>

        {message && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            <i className={`fa-solid ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`} />
            {message.text}
          </div>
        )}
      </section>

      {/* Invites list */}
      <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-outline-variant/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-headline text-on-surface">
              Sent Invitations
            </h2>
            <span className="text-xs text-on-surface-variant/50 font-mono bg-surface-container-high/40 px-2 py-0.5 rounded">
              {initialInvites.length} total
            </span>
          </div>
        </div>

        {initialInvites.length === 0 ? (
          <div className="px-8 py-12 text-sm text-on-surface-variant text-center">
            <i className="fa-solid fa-paper-plane text-2xl text-on-surface-variant/20 mb-3 block" />
            No invitations sent yet. Send your first one above.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/[0.05]">
            {initialInvites.map((inv) => {
              const isExpired = inv.status === "pending" && new Date(inv.expires_at) < new Date();
              const displayStatus = isExpired ? "expired" : inv.status;
              const isLoading = actionPending === inv.id;

              return (
                <div key={inv.id} className="px-6 md:px-8 py-4 hover:bg-primary/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <p className="font-semibold text-on-surface text-sm truncate">
                          {inv.email}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[displayStatus] ?? STATUS_STYLES.pending}`}>
                          {displayStatus}
                        </span>
                      </div>
                      {inv.name && (
                        <p className="text-xs text-on-surface-variant/50 mb-1">{inv.name}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant/40 flex-wrap">
                        <span>
                          <i className="fa-solid fa-ticket mr-1" />
                          <span className="font-mono text-primary/80">{inv.coupon_code}</span>
                        </span>
                        <span>
                          <i className="fa-solid fa-clock mr-1" />
                          Sent {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>
                          <i className="fa-solid fa-hourglass-half mr-1" />
                          Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {displayStatus === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResend(inv.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? <i className="fa-solid fa-spinner fa-spin" /> : "Resend"}
                        </button>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </div>
                    )}

                    {displayStatus === "accepted" && inv.accepted_at && (
                      <span className="text-xs text-emerald-400/60 shrink-0">
                        <i className="fa-solid fa-check mr-1" />
                        Accepted {new Date(inv.accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
