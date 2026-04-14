"use client";

import { useState, useTransition } from "react";
import { sendTestEmailAction } from "./test-email-action";

export default function TestEmailButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{
    kind: "ok" | "err" | "warn";
    text: string;
  } | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMsg(null);
            const res = await sendTestEmailAction();
            if (!res.ok) setMsg({ kind: "err", text: res.message });
            else if (res.skipped) setMsg({ kind: "warn", text: res.message });
            else setMsg({ kind: "ok", text: res.message });
          })
        }
        className="px-4 py-2 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg border border-outline-variant/15 hover:border-primary/30 hover:bg-surface-container-highest disabled:opacity-60 transition-all duration-200"
      >
        {pending ? "Sending..." : "Send test email"}
      </button>
      {msg && (
        <span
          className={
            msg.kind === "ok"
              ? "text-xs text-tertiary"
              : msg.kind === "warn"
                ? "text-xs text-primary"
                : "text-xs text-error"
          }
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
