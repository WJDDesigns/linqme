"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DismissChecklistButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    // Set a cookie that lasts 10 years
    document.cookie =
      "sl_onboarding_dismissed=1; path=/; max-age=315360000; SameSite=Lax";
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDismiss}
      disabled={isPending}
      className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 hover:text-on-surface-variant transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <i className="fa-solid fa-spinner fa-spin" />
      ) : (
        "Dismiss"
      )}
    </button>
  );
}
