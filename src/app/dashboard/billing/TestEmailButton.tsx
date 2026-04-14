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
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send test email"}
      </button>
      {msg && (
        <span
          className={
            msg.kind === "ok"
              ? "text-xs text-emerald-700"
              : msg.kind === "warn"
                ? "text-xs text-amber-700"
                : "text-xs text-red-700"
          }
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
