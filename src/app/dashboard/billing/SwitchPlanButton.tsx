"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchPlanAction } from "./actions";

interface Props {
  targetSlug: string;
  label: string;
  highlight?: boolean;
  isDowngrade?: boolean;
}

export default function SwitchPlanButton({ targetSlug, label, highlight, isDowngrade }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isDowngrade) {
      const confirmed = confirm(
        "Are you sure you want to downgrade? You'll receive credit for your unused time, and the new plan takes effect immediately."
      );
      if (!confirmed) return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchPlanAction(targetSlug);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className={`inline-block w-full text-center rounded-lg px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 ${
          isDowngrade
            ? "border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant/30"
            : highlight
            ? "bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(192,193,255,0.4)]"
            : "border border-outline-variant/30 hover:bg-surface-variant/30"
        }`}
      >
        {pending ? (
          <><i className="fa-solid fa-spinner fa-spin text-[10px] mr-1.5" /> Switching...</>
        ) : (
          <>
            {label}
            {isDowngrade ? (
              <i className="fa-solid fa-arrow-down text-[10px] ml-1" />
            ) : (
              <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
            )}
          </>
        )}
      </button>
      {error && (
        <p className="text-[10px] text-error mt-1 text-center">{error}</p>
      )}
    </div>
  );
}
