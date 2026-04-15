"use client";

import ErrorBoundaryUI from "@/components/ErrorBoundaryUI";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Admin error"
      message="Something went wrong in the admin panel. Try refreshing the page."
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
