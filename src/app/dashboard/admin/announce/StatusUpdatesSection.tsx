"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStatusUpdateAction,
  resolveStatusUpdateAction,
  deleteStatusUpdateAction,
  type StatusUpdateRow,
  type StatusSeverity,
  type StatusComponent,
} from "./status-actions";

const SEVERITIES: { value: StatusSeverity; label: string; color: string; icon: string }[] = [
  { value: "operational", label: "Operational", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "fa-circle-check" },
  { value: "info", label: "Info", color: "bg-primary/10 text-primary border-primary/20", icon: "fa-circle-info" },
  { value: "maintenance", label: "Maintenance", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "fa-wrench" },
  { value: "degraded", label: "Degraded", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "fa-triangle-exclamation" },
  { value: "partial_outage", label: "Partial Outage", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: "fa-circle-exclamation" },
  { value: "major_outage", label: "Major Outage", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: "fa-circle-xmark" },
];

const COMPONENTS: { value: StatusComponent; label: string; icon: string }[] = [
  { value: "platform", label: "Platform", icon: "fa-server" },
  { value: "api", label: "API", icon: "fa-code" },
  { value: "database", label: "Database", icon: "fa-database" },
  { value: "storage", label: "File Storage", icon: "fa-cloud" },
  { value: "authentication", label: "Authentication", icon: "fa-lock" },
  { value: "email", label: "Email Delivery", icon: "fa-envelope" },
  { value: "forms", label: "Form Submissions", icon: "fa-file-lines" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function getSeverityInfo(severity: string) {
  return SEVERITIES.find((s) => s.value === severity) ?? SEVERITIES[0];
}

function getComponentInfo(component: string) {
  return COMPONENTS.find((c) => c.value === component) ?? COMPONENTS[0];
}

interface Props {
  statusUpdates: StatusUpdateRow[];
}

export default function StatusUpdatesSection({ statusUpdates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<StatusSeverity>("info");
  const [component, setComponent] = useState<StatusComponent>("platform");
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await createStatusUpdateAction({ title, message, severity, component });
      if (result.ok) {
        setTitle("");
        setMessage("");
        setSeverity("info");
        setComponent("platform");
        setFeedback({ type: "ok", text: "Status update posted." });
      } else {
        setFeedback({ type: "error", text: result.error ?? "Failed." });
      }
      router.refresh();
    });
  }

  function handleResolve(id: string) {
    startTransition(async () => {
      await resolveStatusUpdateAction(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteStatusUpdateAction(id);
      setConfirmDelete(null);
      router.refresh();
    });
  }

  const activeUpdates = statusUpdates.filter((u) => !u.is_resolved);
  const resolvedUpdates = statusUpdates.filter((u) => u.is_resolved);

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="glass-panel rounded-2xl border border-outline-variant/15 p-6">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
          <i className="fa-solid fa-signal mr-2 text-primary" />
          Post Status Update
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Status title…"
            required
            className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what's happening…"
            rows={3}
            required
            className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Severity */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1.5 block">Severity</label>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                      severity === s.value ? s.color : "border-outline-variant/10 text-on-surface-variant/40 hover:border-outline-variant/30"
                    }`}
                  >
                    <i className={`fa-solid ${s.icon} mr-1`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Component */}
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1.5 block">Component</label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value as StatusComponent)}
                className="w-full px-3 py-2 text-xs font-medium bg-surface-container border border-outline-variant/15 rounded-lg text-on-surface-variant focus:border-primary/40 focus:outline-none transition-colors"
              >
                {COMPONENTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? <i className="fa-solid fa-spinner animate-spin" /> : "Post Update"}
            </button>
            <a href="/status" target="_blank" rel="noreferrer" className="text-xs text-on-surface-variant/40 hover:text-primary transition-colors">
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px] mr-1" />
              View status page
            </a>
          </div>
        </form>

        {feedback && (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            feedback.type === "ok" ? "bg-tertiary/10 border border-tertiary/20 text-tertiary" : "bg-error/10 border border-error/20 text-error"
          }`}>
            <i className={`fa-solid ${feedback.type === "ok" ? "fa-check-circle" : "fa-circle-exclamation"} mr-2`} />
            {feedback.text}
          </div>
        )}
      </div>

      {/* Active incidents */}
      {activeUpdates.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Active ({activeUpdates.length})
          </h3>
          <div className="space-y-2">
            {activeUpdates.map((u) => {
              const sev = getSeverityInfo(u.severity);
              const comp = getComponentInfo(u.component);
              return (
                <div key={u.id} className="rounded-xl bg-surface-container-low/60 border border-outline-variant/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sev.color}`}>
                          <i className={`fa-solid ${sev.icon} mr-1`} />{sev.label}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/40">
                          <i className={`fa-solid ${comp.icon} mr-1`} />{comp.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-on-surface">{u.title}</h4>
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">{u.message}</p>
                      <p className="text-[10px] text-on-surface-variant/30 mt-1">{fmtDate(u.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleResolve(u.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-[10px] font-bold text-tertiary border border-tertiary/20 rounded-lg hover:bg-tertiary/10 transition-all disabled:opacity-50"
                      >
                        <i className="fa-solid fa-check mr-1" />Resolve
                      </button>
                      {confirmDelete === u.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(u.id)} disabled={isPending} className="px-2 py-1 text-[10px] font-bold text-white bg-error rounded-lg">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-[10px] font-bold border border-outline-variant/15 rounded-lg text-on-surface-variant">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(u.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-all">
                          <i className="fa-solid fa-trash text-[10px]" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved timeline */}
      {resolvedUpdates.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Resolved ({resolvedUpdates.length})
          </h3>
          <div className="space-y-2">
            {resolvedUpdates.slice(0, 10).map((u) => {
              const sev = getSeverityInfo(u.severity);
              const comp = getComponentInfo(u.component);
              return (
                <div key={u.id} className="rounded-xl bg-surface-container-low/30 border border-outline-variant/[0.04] p-4 opacity-70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <i className="fa-solid fa-circle-check mr-1" />Resolved
                        </span>
                        <span className="text-[10px] text-on-surface-variant/30">
                          <i className={`fa-solid ${comp.icon} mr-1`} />{comp.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-on-surface/60">{u.title}</h4>
                      <p className="text-xs text-on-surface-variant/40 mt-0.5">{u.message}</p>
                      <p className="text-[10px] text-on-surface-variant/20 mt-1">
                        Posted {fmtDate(u.created_at)}
                        {u.resolved_at && <> · Resolved {fmtDate(u.resolved_at)}</>}
                      </p>
                    </div>
                    {confirmDelete === u.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleDelete(u.id)} disabled={isPending} className="px-2 py-1 text-[10px] font-bold text-white bg-error rounded-lg">Yes</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-[10px] font-bold border border-outline-variant/15 rounded-lg text-on-surface-variant">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-all shrink-0">
                        <i className="fa-solid fa-trash text-[10px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
