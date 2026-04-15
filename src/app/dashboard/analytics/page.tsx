import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), { ssr: false });

export default async function AnalyticsPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Analytics</h1>
        <p className="text-sm text-on-surface-variant mt-2">No workspace found.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  // Page views last 30 days (daily breakdown)
  const { data: pageViews } = await admin
    .from("page_views")
    .select("created_at, path, is_unique")
    .eq("partner_id", account.id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  // Form events last 30 days
  const { data: formEvents } = await admin
    .from("form_events")
    .select("created_at, form_slug, event_type, step_index")
    .eq("partner_id", account.id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  // Submission stats
  const { data: submissions } = await admin
    .from("submissions")
    .select("id, status, created_at, form_slug")
    .eq("partner_id", account.id)
    .gte("created_at", thirtyDaysAgo);

  // Partner count (sub-partners)
  const { count: partnerCount } = await admin
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.userId);

  // Aggregate daily views
  const dailyViews: Record<string, { total: number; unique: number }> = {};
  for (const pv of pageViews ?? []) {
    const day = pv.created_at.slice(0, 10);
    if (!dailyViews[day]) dailyViews[day] = { total: 0, unique: 0 };
    dailyViews[day].total++;
    if (pv.is_unique) dailyViews[day].unique++;
  }

  // Build 30-day chart data
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    chartData.push({
      date: key,
      label,
      views: dailyViews[key]?.total ?? 0,
      unique: dailyViews[key]?.unique ?? 0,
    });
  }

  // Form funnel stats
  const funnelMap: Record<string, { views: number; starts: number; completions: number }> = {};
  for (const fe of formEvents ?? []) {
    if (!funnelMap[fe.form_slug]) funnelMap[fe.form_slug] = { views: 0, starts: 0, completions: 0 };
    if (fe.event_type === "view") funnelMap[fe.form_slug].views++;
    if (fe.event_type === "start") funnelMap[fe.form_slug].starts++;
    if (fe.event_type === "complete") funnelMap[fe.form_slug].completions++;
  }

  const funnelData = Object.entries(funnelMap).map(([slug, stats]) => ({
    form: slug,
    ...stats,
    conversionRate: stats.starts > 0 ? Math.round((stats.completions / stats.starts) * 100) : 0,
  }));

  // Submission stats
  const subs = submissions ?? [];
  const totalSubmissions = subs.length;
  const completedSubmissions = subs.filter((s) => s.status === "submitted").length;
  const draftSubmissions = subs.filter((s) => s.status === "draft").length;

  // 7-day vs prior 7-day comparison
  const last7Views = (pageViews ?? []).filter((pv) => pv.created_at >= sevenDaysAgo).length;
  const prior7Start = new Date(now.getTime() - 14 * 86400000).toISOString();
  const prior7Views = (pageViews ?? []).filter((pv) => pv.created_at >= prior7Start && pv.created_at < sevenDaysAgo).length;
  const viewsTrend = prior7Views > 0 ? Math.round(((last7Views - prior7Views) / prior7Views) * 100) : 0;

  const last7Subs = subs.filter((s) => s.created_at >= sevenDaysAgo).length;
  const prior7Subs = subs.filter((s) => s.created_at >= prior7Start && s.created_at < sevenDaysAgo).length;
  const subsTrend = prior7Subs > 0 ? Math.round(((last7Subs - prior7Subs) / prior7Subs) * 100) : 0;

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const pv of pageViews ?? []) {
    pageCounts[pv.path] = (pageCounts[pv.path] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Analytics</h1>
        <p className="text-on-surface-variant mt-1">
          Performance overview for the last 30 days.
        </p>
      </header>

      <AnalyticsCharts
        chartData={chartData}
        funnelData={funnelData}
        topPages={topPages}
        stats={{
          totalViews: (pageViews ?? []).length,
          uniqueViews: (pageViews ?? []).filter((pv) => pv.is_unique).length,
          totalSubmissions,
          completedSubmissions,
          draftSubmissions,
          partnerCount: partnerCount ?? 0,
          viewsTrend,
          subsTrend,
          last7Views,
          last7Subs,
        }}
      />
    </div>
  );
}
