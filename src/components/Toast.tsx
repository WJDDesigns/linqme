"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, string> = {
  success:
    "border-l-4 border-l-tertiary",
  error:
    "border-l-4 border-l-error",
  info:
    "border-l-4 border-l-primary",
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: "fa-circle-check text-tertiary",
  error: "fa-circle-exclamation text-error",
  info: "fa-circle-info text-primary",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        removeToast(id);
        timersRef.current.delete(id);
      }, 5000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Clean up timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto bg-surface-container border border-outline-variant/10 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[420px] transition-all duration-300 ${TYPE_STYLES[t.type]} ${
              t.exiting
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0 animate-slide-in-right"
            }`}
          >
            <i className={`fa-solid ${TYPE_ICONS[t.type]} text-sm shrink-0`} />
            <p className="text-sm text-on-surface flex-1">{t.message}</p>
            <button
              onClick={() => {
                const timer = timersRef.current.get(t.id);
                if (timer) {
                  clearTimeout(timer);
                  timersRef.current.delete(t.id);
                }
                removeToast(t.id);
              }}
              className="text-on-surface-variant/40 hover:text-on-surface transition-colors shrink-0 ml-1"
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
