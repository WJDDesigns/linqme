"use client";

import { useEffect } from "react";
import { reportErrorFromClient } from "@/lib/error-tracking";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export default function ErrorBoundaryUI({
  error,
  reset,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again or contact support if the problem persists.",
  backHref = "/",
  backLabel = "Go Home",
}: Props) {
  useEffect(() => {
    reportErrorFromClient({
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-error-container/20 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-error" />
        </div>
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-3">{title}</h1>
        <p className="text-on-surface-variant/60 mb-8">{message}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300"
          >
            Try Again
          </button>
          <a
            href={backHref}
            className="px-6 py-3 border border-outline-variant/20 rounded-xl text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            {backLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
