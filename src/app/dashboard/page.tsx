import Link from "next/link";
import { requireSession, getVisiblePartners } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardOverview() {
  const session = await requireSession();
  const partners = await getVisiblePartners();

  const supabase = await createClient();
  const { count: submissionCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
          {session.role === "superadmin" ? "Overview" : "Your dashboard"}
        </h1>
        <p className="text-on-surface-variant font-body mt-1">
          {session.role === "superadmin"
            ? "Platform-wide view. Manage partners, track submissions, configure settings."
            : "Manage your brand, form, and client submissions."}
        </p>
      </header>

      {/* Stat cards — Bento style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Partners"
          value={partners.length.toString()}
          color="primary"
        />
        <StatCard
          label="Submissions"
          value={(submissionCount ?? 0).toString()}
          color="on-surface"
        />
        <StatCard
          label="Role"
          value={session.role}
          color="tertiary"
        />
      </div>

      {/* Recent partners */}
      <section className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between px-8 py-5">
          <h2 className="text-lg font-bold font-headline text-on-surface tracking-tight">Partners</h2>
          {session.role === "superadmin" && (
            <Link
              href="/dashboard/partners/new"
              className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-xs hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all"
            >
              + New partner
            </Link>
          )}
        </div>

        {partners.length === 0 ? (
          <div className="px-8 pb-8 text-sm text-on-surface-variant">
            No partners yet. {session.role === "superadmin" && "Create one to get started."}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/5">
            {partners.slice(0, 5).map((p) => (
              <div key={p.id} className="grid grid-cols-12 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
                <div className="col-span-6 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary text-xs font-bold"
                    style={{ backgroundColor: p.primary_color ? `${p.primary_color}20` : undefined }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-xs text-on-surface-variant/60">
                      {p.custom_domain || `${p.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`}
                    </p>
                  </div>
                </div>
                <div className="col-span-3">
                  <span className="text-xs text-on-surface-variant font-mono">{p.slug}</span>
                </div>
                <div className="col-span-3 text-right">
                  <Link
                    href={`/dashboard/partners/${p.id}`}
                    className="text-xs font-bold text-primary hover:underline transition-all"
                  >
                    Manage <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    "on-surface": "text-on-surface",
    tertiary: "text-tertiary",
  };
  return (
    <div className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden group">
      <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/60 mb-2">{label}</p>
      <h3 className={`text-4xl font-extrabold font-headline ${colorMap[color] ?? "text-on-surface"}`}>
        {value}
      </h3>
    </div>
  );
}
