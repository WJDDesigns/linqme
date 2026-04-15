"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  inviteAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}

export default function InvitePartnerForm({ inviteAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !partnerName.trim()) return;
    setSending(true);
    setMessage(null);

    const fd = new FormData();
    fd.set("email", email.trim());
    fd.set("partnerName", partnerName.trim());

    const result = await inviteAction(fd);

    if (result.ok) {
      setMessage({ type: "ok", text: `Invite sent to ${email}` });
      setEmail("");
      setPartnerName("");
      setTimeout(() => {
        setOpen(false);
        setMessage(null);
        router.refresh();
      }, 2000);
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to send invite." });
    }
    setSending(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all"
      >
        <i className="fa-solid fa-paper-plane text-xs mr-2" />
        Invite Partner
      </button>
    );
  }

  const INPUT_CLS =
    "w-full rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <div className="bg-surface-container rounded-2xl border border-primary/20 p-6 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface">
          <i className="fa-solid fa-paper-plane text-primary text-xs mr-2" />
          Invite a new partner
        </h3>
        <button
          onClick={() => { setOpen(false); setMessage(null); }}
          className="text-xs text-on-surface-variant/40 hover:text-on-surface transition-colors"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Partner / Company name
          </label>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Acme Agency"
            required
            className={INPUT_CLS}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            required
            className={INPUT_CLS}
          />
        </div>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === "ok"
                ? "bg-tertiary/10 border border-tertiary/20 text-tertiary"
                : "bg-error/10 border border-error/20 text-error"
            }`}
          >
            <i
              className={`fa-solid ${
                message.type === "ok" ? "fa-check-circle" : "fa-circle-exclamation"
              } mr-2`}
            />
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300 disabled:opacity-50"
          >
            {sending ? (
              <span className="inline-flex items-center gap-2">
                <i className="fa-solid fa-spinner animate-spin text-xs" />
                Sending…
              </span>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane text-xs mr-2" />
                Send Invite
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setMessage(null); }}
            className="px-4 py-3 text-xs font-bold text-on-surface-variant/60 hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="text-[10px] text-on-surface-variant/40 mt-4">
        This will create a partner space and send them an email invitation to manage their branding, view submissions, and customize their intake form.
      </p>
    </div>
  );
}
