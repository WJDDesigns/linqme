"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Short message shown below the spinner */
  message?: string;
  /** Delay in ms before showing (prevents flash on fast loads). Default 150. */
  delay?: number;
}

export default function LoadingOverlay({ message = "Loading...", delay = 150 }: Props) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="flex flex-col items-center justify-center py-32 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-on-surface-variant/60 font-medium animate-pulse">{message}</p>
    </div>
  );
}
