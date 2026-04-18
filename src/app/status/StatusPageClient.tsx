"use client";

import Link from "next/link";

interface ComponentStatus {
  key: string;
  label: string;
  icon: string;
  status: string;
}

interface Incident {
  id: string;
  title: string;
  message: string;
  severity: string;
  component: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface Props {
  overallStatus: string;
  components: ComponentStatus[];
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  operational: { label: "All Systems Operational", color: "text-emerald-400", bg: "bg-emerald-500", icon: "fa-circle-check" },
  maintenance: { label: "Scheduled Maintenance", color: "text-blue-400", bg: "bg-blue-500", icon: "fa-wrench" },
  degraded: { label: "Degraded Performance", color: "text-amber-400", bg: "bg-amber-500", icon: "fa-triangle-exclamation" },
  partial_outage: { label: "Partial Outage", color: "text-orange-400", bg: "bg-orange-500", icon: "fa-circle-exclamation" },
  major_outage: { label: "Major Outage", color: "text-red-400", bg: "bg-red-500", icon: "fa-circle-xmark" },
  info: { label: "Informational", color: "text-blue-300", bg: "bg-blue-400", icon: "fa-circle-info" },
};

function getConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.operational;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Group resolved incidents by date
function groupByDate(incidents: Incident[]) {
  const groups: { date: string; items: Incident[] }[] = [];
  for (const inc of incidents) {
    const date = new Date(inc.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const existing = groups.find((g) => g.date === date);
    if (existing) existing.items.push(inc);
    else groups.push({ date, items: [inc] });
  }
  return groups;
}

export default function StatusPageClient({ overallStatus, components, activeIncidents, resolvedIncidents }: Props) {
  const overall = getConfig(overallStatus);
  const resolvedGroups = groupByDate(resolvedIncidents);

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd]">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#696cf8]/20 flex items-center justify-center">
              <i className="fa-solid fa-link text-[#c0c1ff] text-sm" />
            </div>
            <span className="text-lg font-bold font-headline text-white/90 group-hover:text-white transition-colors">
              linqme
            </span>
          </Link>
          <span className="text-xs text-white/30 font-medium">System Status</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Overall status banner */}
        <div className={`rounded-2xl p-6 sm:p-8 border ${
          overallStatus === "operational"
            ? "bg-emerald-500/[0.06] border-emerald-500/15"
            : overallStatus === "major_outage"
            ? "bg-red-500/[0.08] border-red-500/20"
            : "bg-amber-500/[0.06] border-amber-500/15"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${overall.bg}/15 flex items-center justify-center`}>
              <i className={`fa-solid ${overall.icon} text-xl ${overall.color}`} />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold font-headline ${overall.color}`}>
                {overall.label}
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                Last checked {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {/* Component statuses */}
        <section>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
            Components
          </h2>
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
            {components.map((comp) => {
              const cfg = getConfig(comp.status);
              return (
                <div key={comp.key} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid ${comp.icon} text-sm text-white/25 w-5 text-center`} />
                    <span className="text-sm font-medium text-white/80">{comp.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label.replace("All Systems ", "")}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active incidents */}
        {activeIncidents.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
              Active Incidents
            </h2>
            <div className="space-y-3">
              {activeIncidents.map((inc) => {
                const cfg = getConfig(inc.severity);
                return (
                  <div key={inc.id} className={`rounded-2xl border p-5 ${
                    inc.severity === "major_outage" ? "bg-red-500/[0.05] border-red-500/15" :
                    inc.severity === "partial_outage" ? "bg-orange-500/[0.05] border-orange-500/15" :
                    "bg-white/[0.02] border-white/[0.06]"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg}/15 flex items-center justify-center shrink-0 mt-0.5`}>
                        <i className={`fa-solid ${cfg.icon} text-sm ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white/90">{inc.title}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg}/10 ${cfg.color} border border-current/20`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 mt-1">{inc.message}</p>
                        <p className="text-xs text-white/20 mt-2">
                          <i className="fa-regular fa-clock mr-1" />
                          {fmtRelative(inc.created_at)} · {fmtDate(inc.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Timeline — resolved incidents grouped by date */}
        <section>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
            Past Incidents
          </h2>

          {resolvedGroups.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] p-8 text-center">
              <p className="text-sm text-white/30">No past incidents in the last 30 days.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {resolvedGroups.map((group) => (
                <div key={group.date}>
                  <h3 className="text-xs font-bold text-white/20 mb-2">{group.date}</h3>
                  <div className="border-l-2 border-white/[0.06] pl-5 space-y-4 ml-2">
                    {group.items.map((inc) => {
                      const cfg = getConfig(inc.severity);
                      return (
                        <div key={inc.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500/30 border-2 border-[#0b1326]" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-medium text-white/60">{inc.title}</h4>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-white/20">
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-white/30 mt-0.5">{inc.message}</p>
                            <p className="text-[10px] text-white/15 mt-1">
                              Reported {fmtDate(inc.created_at)}
                              {inc.resolved_at && <> · Resolved {fmtDate(inc.resolved_at)}</>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-white/20">Powered by linqme</span>
          <span className="text-xs text-white/15">Updated every 60 seconds</span>
        </div>
      </footer>
    </div>
  );
}
