"use client";

import Link from "next/link";

interface Props {
  used: number;
  limit: number;
  planName: string;
}

/**
 * Shows a contextual upgrade banner when a free-tier user is at or near
 * their monthly submission limit. Displayed above the main content area.
 */
export default function UpgradeBanner({ used, limit, planName }: Props) {
  const ratio = limit > 0 ? used / limit : 1;

  // Don't show if usage is below 80%
  if (ratio < 0.8) return null;

  const isAtLimit = used >= limit;

  return (
    <div
      className={`mx-6 md:mx-10 mt-6 rounded-2xl border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
        isAtLimit
          ? "bg-error/5 border-error/20"
          : "bg-amber-500/5 border-amber-500/20"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <i
            className={`fa-solid ${isAtLimit ? "fa-circle-exclamation text-error" : "fa-triangle-exclamation text-amber-400"} text-sm`}
          />
          <span className="text-sm font-bold text-on-surface">
            {isAtLimit
              ? "You've reached your submission limit"
              : "You're almost at your submission limit"}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          {isAtLimit
            ? `Your ${planName} plan allows ${limit} submission${limit !== 1 ? "s" : ""} per month. Upgrade to keep onboarding clients without interruption.`
            : `You've used ${used} of ${limit} submission${limit !== 1 ? "s" : ""} this month on the ${planName} plan. Upgrade now to avoid hitting your limit.`}
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-xs hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] transition-all whitespace-nowrap"
      >
        <i className="fa-solid fa-rocket text-[10px] mr-1.5" />
        Upgrade plan
      </Link>
    </div>
  );
}
