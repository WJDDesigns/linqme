"use client";

import { useMemo, useState } from "react";

interface Submission {
  id: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
  submitted_at: string | null;
  form_slug: string | null;
  partner_form_id: string | null;
}

interface Props {
  submissions: Submission[];
  forms: { id: string; name: string }[];
}

const TIMEFRAMES = [
  { key: "7d", label: "7D", days: 7 },
  { key: "14d", label: "14D", days: 14 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
] as const;

type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

export default function ActivityDashboard({ submissions, forms }: Props) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30d");
  const tfDays = TIMEFRAMES.find((t) => t.key === timeframe)!.days;

  const formNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const f of forms) m[f.id] = f.name;
    return m;
  }, [forms]);

  // Build trend data based on selected timeframe
  const trendData = useMemo(() => {
    const now = new Date();
    const days: { label: string; date: string; count: number }[] = [];
    for (let i = tfDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        date: dateStr,
        count: 0,
      });
    }
    for (const sub of submissions) {
      const dateStr = sub.created_at?.slice(0, 10);
      const day = days.find((d) => d.date === dateStr);
      if (day) day.count++;
    }
    return days;
  }, [submissions, tfDays]);

  const maxCount = Math.max(1, ...trendData.map((d) => d.count));

  // Recent activity — last 10 submissions
  const recentActivity = useMemo(() => {
    return submissions.slice(0, 10).map((sub) => ({
      id: sub.id,
      name: sub.client_name || sub.client_email || "Anonymous",
      formName: sub.partner_form_id ? formNameMap[sub.partner_form_id] ?? "Unknown form" : "Unknown form",
      status: sub.status,
      time: sub.submitted_at || sub.created_at,
    }));
  }, [submissions, formNameMap]);

  // This week vs last week comparison
  const weekComparison = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    let thisWeek = 0;
    let lastWeek = 0;
    for (const sub of submissions) {
      const d = new Date(sub.created_at);
      if (d >= startOfThisWeek) thisWeek++;
      else if (d >= startOfLastWeek) lastWeek++;
    }
    const change = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    return { thisWeek, lastWeek, change };
  }, [submissions]);

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const statusIcon: Record<string, { icon: string; color: string }> = {
    submitted: { icon: "fa-circle-check", color: "text-green-400" },
    draft: { icon: "fa-pen", color: "text-amber-400" },
    approved: { icon: "fa-thumbs-up", color: "text-blue-400" },
    rejected: { icon: "fa-circle-xmark", color: "text-red-400" },
  };

  if (submissions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Submission trend chart — spans 2 cols */}
      <div className="lg:col-span-2 rounded-2xl border border-outline-variant/[0.08] bg-surface-container/20 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-on-surface font-headline">Submissions</h3>
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-label mt-0.5">Last {tfDays} days</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center rounded-lg border border-outline-variant/15 overflow-hidden">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                    timeframe === tf.key
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface-variant"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-on-surface-variant">This week: <strong className="text-on-surface">{weekComparison.thisWeek}</strong></span>
            <span className={`flex items-center gap-1 text-xs font-bold ${weekComparison.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              <i className={`fa-solid ${weekComparison.change >= 0 ? "fa-arrow-up" : "fa-arrow-down"} text-[9px]`} />
              {Math.abs(weekComparison.change)}%
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-[3px] h-28">
          {trendData.map((day, i) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 px-2 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface text-[10px] font-bold whitespace-nowrap shadow-lg">
                  {day.label}: {day.count}
                </div>
                <div
                  className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-100"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: day.count > 0 ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)",
                    opacity: day.count > 0 ? 0.7 : 0.15,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels — frequency adapts to timeframe */}
        <div className="flex gap-[3px] mt-1.5">
          {trendData.map((day, i) => {
            const labelEvery = tfDays <= 14 ? 2 : tfDays <= 30 ? 5 : 10;
            return (
              <div key={day.date} className="flex-1 text-center">
                {i % labelEvery === 0 ? (
                  <span className="text-[8px] text-on-surface-variant/40 font-label">{day.label.split(" ")[1]}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity feed */}
      <div className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/20 p-6">
        <h3 className="text-sm font-bold text-on-surface font-headline mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-on-surface-variant/50 text-center py-6">No submissions yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item) => {
              const si = statusIcon[item.status] ?? { icon: "fa-circle", color: "text-on-surface-variant/40" };
              return (
                <div key={item.id} className="flex items-start gap-3 group">
                  <div className={`w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5`}>
                    <i className={`fa-solid ${si.icon} text-[10px] ${si.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-on-surface-variant/60 truncate">{item.formName}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/40 shrink-0 mt-0.5">{relativeTime(item.time)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
