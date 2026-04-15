"use client";

import ErrorBoundaryUI from "@/components/ErrorBoundaryUI";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Dashboard error"
      message="Something went wrong loading this page. Your data is safe — try refreshing."
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
