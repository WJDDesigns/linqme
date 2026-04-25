"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onCancel();
  }

  if (!open) return null;

  const confirmColors =
    variant === "danger"
      ? "bg-error text-white hover:bg-error/80"
      : variant === "warning"
        ? "bg-amber-500 text-white hover:bg-amber-500/80"
        : "bg-primary text-on-primary hover:bg-primary/80";

  const iconName =
    variant === "danger"
      ? "fa-triangle-exclamation"
      : variant === "warning"
        ? "fa-circle-exclamation"
        : "fa-circle-question";

  const iconColor =
    variant === "danger"
      ? "text-error"
      : variant === "warning"
        ? "text-amber-500"
        : "text-primary";

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-surface-container rounded-2xl shadow-2xl shadow-black/30 border border-outline-variant/10 w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-150">
        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === "danger" ? "bg-error/10" : variant === "warning" ? "bg-amber-500/10" : "bg-primary/10"
          }`}>
            <i className={`fa-solid ${iconName} ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">{title}</h3>
            <p className="text-sm text-on-surface-variant/70 mt-1">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-outline-variant/15 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${confirmColors}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-xs" />
                Processing…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
