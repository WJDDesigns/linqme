"use client";

import { useState, useTransition } from "react";
import { changePartnerTierAction } from "./actions";

const TIERS = [
  { value: "free", label: "Free", color: "text-on-surface-variant/60" },
  { value: "starter", label: "Starter", color: "text-blue-400" },
  { value: "pro", label: "Pro", color: "text-primary" },
  { value: "agency", label: "Agency", color: "text-amber-400" },
] as const;

interface Props {
  partnerId: string;
  currentTier: string;
}

export default function TierChanger({ partnerId, currentTier }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTier = e.target.value;
    if (newTier === currentTier) return;

    const tierLabel = TIERS.find((t) => t.value === newTier)?.label ?? newTier;
    const confirmed = confirm(
      `Change this customer's plan to ${tierLabel}? This is an admin override and won't affect their Stripe subscription.`,
    );
    if (!confirmed) {
      e.target.value = currentTier;
      return;
    }

    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePartnerTierAction(partnerId, newTier);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error ?? "Failed to change tier.");
        e.target.value = currentTier;
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentTier}
        onChange={handleChange}
        disabled={pending}
        onClick={(e) => e.preventDefault()}
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border bg-surface-container-lowest text-on-surface cursor-pointer outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50 appearance-none pr-5 transition-all"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 6px center",
        }}
      >
        {TIERS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {pending && <i className="fa-solid fa-spinner fa-spin text-[10px] text-on-surface-variant/40" />}
      {success && <i className="fa-solid fa-check text-[10px] text-tertiary" />}
      {error && <span className="text-[10px] text-error">{error}</span>}
    </div>
  );
}
