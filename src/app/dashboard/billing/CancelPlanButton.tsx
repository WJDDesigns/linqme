"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscriptionAction, reactivateSubscriptionAction } from "./actions";

interface Props {
  isCanceling: boolean;
}

export default function CancelPlanButton({ isCanceling }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    const confirmed = confirm(
      "Are you sure you want to cancel? You'll keep access until the end of your current billing period, then your account will be downgraded to the free plan."
    );
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleReactivate() {
    setError(null);
    startTransition(async () => {
      const result = await reactivateSubscriptionAction();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="pt-3 border-t border-outline-variant/10">
      {isCanceling ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant/60">Your subscription will cancel at period end.</span>
          <button
            onClick={handleReactivate}
            disabled={pending}
            className="text-xs font-bold text-primary hover:underline disabled:opacity-50"
          >
            {pending ? "Reactivating..." : "Keep my plan"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleCancel}
          disabled={pending}
          className="text-xs font-bold text-error/70 hover:text-error transition-colors disabled:opacity-50"
        >
          {pending ? (
            <><i className="fa-solid fa-spinner fa-spin text-[10px] mr-1.5" />Canceling...</>
          ) : (
            <><i className="fa-solid fa-arrow-down-to-line text-[10px] mr-1.5" />Cancel subscription</>
          )}
        </button>
      )}
      {error && (
        <p className="text-[10px] text-error mt-1">{error}</p>
      )}
    </div>
  );
}
