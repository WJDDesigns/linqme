"use client";

import ErrorBoundaryUI from "@/components/ErrorBoundaryUI";

export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryUI
      error={error}
      reset={reset}
      title="Page error"
      message="Something went wrong loading this page. Please try again."
      backHref="/"
      backLabel="Go Home"
    />
  );
}
