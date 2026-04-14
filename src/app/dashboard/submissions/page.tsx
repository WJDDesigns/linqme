import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-container-high text-on-surface-variant",
  submitted: "bg-primary/10 text-primary border border-primary/20",
  in_review: "bg-tertiary/10 text-tertiary border border-tertiary/20",
  complete: "bg-tertiary/10 text-tertiary border border-tertiary/20",
  archived: "bg-surface-container-high text-on-surface-variant/60",
};

export default async function SubmissionsListPage() {
  await requireSession();
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      `id, status, client_name, client_email, submitted_at, created_at,
       partners ( id, name, slug, primary_color )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = submissions ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Submissions</h1>
        <p className="text-on-surface-variant mt-1">
          Onboarding responses from clients.
        </p>
      </header>

      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {rows.length === 0 ? (
          <div className="p-8 text-sm text-on-surface-variant text-center">
            No submissions yet.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 px-8 py-5 text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold border-b border-outline-variant/10">
              <div className="col-span-4">Client</div>
              <div className="col-span-3">Partner</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Received</div>
              <div className="col-span-1" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-outline-variant/5">
              {rows.map((s) => {
                const partner = Array.isArray(s.partners) ? s.partners[0] : s.partners;
                const when = s.submitted_at || s.created_at;
                return (
                  <div key={s.id} className="grid grid-cols-12 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
                    <div className="col-span-4">
                      <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {s.client_name || "\u2014"}
                      </p>
                      <p className="text-xs text-on-surface-variant/60">{s.client_email || "no email yet"}</p>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-on-primary text-[10px] font-bold"
                        style={{ backgroundColor: partner?.primary_color || "#696cf8" }}
                      >
                        {partner?.name?.slice(0, 1).toUpperCase() ?? "?"}
                      </div>
                      <span className="text-sm text-on-surface">{partner?.name ?? "\u2014"}</span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                          STATUS_STYLES[s.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs text-on-surface">
                      {when ? new Date(when).toLocaleDateString() : "\u2014"}
                    </div>
                    <div className="col-span-1 text-right">
                      <Link
                        href={`/dashboard/submissions/${s.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
