"use client";

import { useState } from "react";

export default function DataExportSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "linqme-data-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel rounded-2xl border border-outline-variant/15 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-download text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Download My Data
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Export a copy of your account data including your profile,
            workspace info, submissions, passkeys, and billing history as a
            JSON file.
          </p>

          {error && (
            <p className="text-xs text-error font-medium mt-2">
              <i className="fa-solid fa-circle-exclamation text-[10px] mr-1" />
              {error}
            </p>
          )}

          <button
            onClick={handleDownload}
            disabled={loading}
            className="mt-4 px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                Generating...
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-file-arrow-down text-[10px] mr-2" />
                Download My Data
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
