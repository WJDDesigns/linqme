"use client";

import { useState, useRef, useEffect } from "react";

interface AccountContext {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  role: "partner_owner" | "partner_member";
  isOwnAccount: boolean;
}

interface Props {
  contexts: AccountContext[];
  activePartnerId: string;
}

export default function AccountSwitcher({ contexts, activePartnerId }: Props) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (contexts.length < 2) return null;

  const active = contexts.find((c) => c.partnerId === activePartnerId) ?? contexts[0];

  async function switchTo(partnerId: string) {
    if (partnerId === activePartnerId) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await fetch("/api/account/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div ref={ref} className="relative px-3 mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-surface-container/60 border border-outline-variant/10 hover:border-primary/20 hover:bg-surface-container transition-all duration-200 text-left"
      >
        <i className="fa-solid fa-shuffle text-[10px] text-primary/60 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-semibold">
            Account
          </p>
          <p className="text-xs font-bold text-on-surface truncate">
            {active.partnerName}
          </p>
        </div>
        <i className={`fa-solid fa-chevron-down text-[9px] text-on-surface-variant/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 bottom-full mb-1 rounded-xl bg-surface-container border border-outline-variant/10 shadow-xl z-50 overflow-hidden">
          {contexts.map((ctx) => {
            const isActive = ctx.partnerId === activePartnerId;
            return (
              <button
                key={ctx.partnerId}
                onClick={() => switchTo(ctx.partnerId)}
                disabled={switching}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors duration-150
                  ${isActive ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-highest/60"}`}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                  {ctx.partnerName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ctx.partnerName}</p>
                  <p className="text-[10px] text-on-surface-variant/50">
                    {ctx.isOwnAccount ? "Your agency" : "Invited member"}
                  </p>
                </div>
                {isActive && (
                  <i className="fa-solid fa-check text-[10px] text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
