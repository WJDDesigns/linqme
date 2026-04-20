import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";

/** Storage limits per tier in bytes */
const TIER_STORAGE_LIMITS: Record<string, number | null> = {
  free: 100 * 1024 * 1024,                  // 100 MB
  starter: 1 * 1024 * 1024 * 1024,         // 1 GB
  paid: 1 * 1024 * 1024 * 1024,            // 1 GB (legacy)
  pro: 100 * 1024 * 1024 * 1024,           // 100 GB
  unlimited: null,                           // legacy
  enterprise: 500 * 1024 * 1024 * 1024,    // legacy
  agency: 500 * 1024 * 1024 * 1024,        // 500 GB
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  paid: "Starter",
  pro: "Pro",
  unlimited: "Agency",
  enterprise: "Agency",
  agency: "Agency",
};

const TIER_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  free: { label: "Free", color: "text-on-surface-variant/60", bg: "bg-surface-container-high", border: "border-outline-variant/15" },
  starter: { label: "Starter", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  paid: { label: "Starter", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  pro: { label: "Pro", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  unlimited: { label: "Agency", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  enterprise: { label: "Agency", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  agency: { label: "Agency", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

/** Map MIME types into human-friendly categories */
function categorize(mime: string | null): string {
  if (!mime) return "Other";
  if (mime.startsWith("image/")) return "Images";
  if (mime === "application/pdf") return "PDFs";
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime === "text/csv"
  )
    return "Spreadsheets";
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    mime === "text/plain" ||
    mime === "text/rtf"
  )
    return "Documents";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime === "application/zip" || mime.includes("compressed") || mime.includes("archive"))
    return "Archives";
  return "Other";
}

const CATEGORY_ICONS: Record<string, string> = {
  Images: "fa-image",
  PDFs: "fa-file-pdf",
  Spreadsheets: "fa-file-excel",
  Documents: "fa-file-word",
  Video: "fa-file-video",
  Audio: "fa-file-audio",
  Archives: "fa-file-zipper",
  Other: "fa-file",
};

const CATEGORY_COLORS: Record<string, string> = {
  Images: "text-emerald-400",
  PDFs: "text-red-400",
  Spreadsheets: "text-green-400",
  Documents: "text-blue-400",
  Video: "text-purple-400",
  Audio: "text-orange-400",
  Archives: "text-yellow-400",
  Other: "text-on-surface-variant/60",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 ? val.toFixed(2) : val < 100 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

function formatBytesShort(bytes: number): string {
  if (bytes === 0) return "0";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
}

interface PartnerStorage {
  partnerId: string;
  partnerName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  planTier: string;
  totalBytes: number;
  fileCount: number;
  categories: Record<string, { bytes: number; count: number }>;
}

export default async function AdminStoragePage() {
  await requireSuperadmin();
  const admin = createAdminClient();

  // Fetch all partners
  const { data: partners } = await admin
    .from("partners")
    .select("id, name, logo_url, primary_color, plan_tier")
    .order("name", { ascending: true });

  // Fetch all submission files with their partner_id via the submissions join
  const { data: files } = await admin
    .from("submission_files")
    .select("size_bytes, mime_type, submissions!inner(partner_id)")
    .limit(50000);

  // Also fetch logo storage -- logos are stored in the logos bucket
  // We'll approximate logo sizes from the partners table (logo_url presence)
  // Since logos are max 5MB each and there are few, we'll note them but focus on submissions

  // Build per-partner storage map
  const storageMap: Record<string, PartnerStorage> = {};

  for (const p of partners ?? []) {
    storageMap[p.id] = {
      partnerId: p.id,
      partnerName: p.name,
      logoUrl: p.logo_url,
      primaryColor: p.primary_color,
      planTier: p.plan_tier ?? "free",
      totalBytes: 0,
      fileCount: 0,
      categories: {},
    };
  }

  // Aggregate file data per partner
  for (const f of files ?? []) {
    const sub = f.submissions as unknown as { partner_id: string };
    const pid = sub?.partner_id;
    if (!pid || !storageMap[pid]) continue;

    const bytes = (f.size_bytes as number) ?? 0;
    const cat = categorize(f.mime_type as string | null);

    storageMap[pid].totalBytes += bytes;
    storageMap[pid].fileCount += 1;

    if (!storageMap[pid].categories[cat]) {
      storageMap[pid].categories[cat] = { bytes: 0, count: 0 };
    }
    storageMap[pid].categories[cat].bytes += bytes;
    storageMap[pid].categories[cat].count += 1;
  }

  // Sort by total storage descending
  const sorted = Object.values(storageMap).sort((a, b) => b.totalBytes - a.totalBytes);

  // Platform-wide stats
  const totalStorage = sorted.reduce((sum, p) => sum + p.totalBytes, 0);
  const totalFiles = sorted.reduce((sum, p) => sum + p.fileCount, 0);
  const partnersWithFiles = sorted.filter((p) => p.fileCount > 0).length;

  // Global category breakdown
  const globalCategories: Record<string, { bytes: number; count: number }> = {};
  for (const p of sorted) {
    for (const [cat, data] of Object.entries(p.categories)) {
      if (!globalCategories[cat]) globalCategories[cat] = { bytes: 0, count: 0 };
      globalCategories[cat].bytes += data.bytes;
      globalCategories[cat].count += data.count;
    }
  }
  const sortedCategories = Object.entries(globalCategories).sort(
    ([, a], [, b]) => b.bytes - a.bytes,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8">
      <header>
        <Link
          href="/dashboard/admin"
          className="text-xs text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-[10px] mr-1" /> Platform
        </Link>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mt-2">
          Storage
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          File storage usage across all customers.
        </p>
      </header>

      {/* Platform-wide stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Storage", value: formatBytes(totalStorage), icon: "fa-hard-drive" },
          { label: "Total Files", value: totalFiles.toLocaleString(), icon: "fa-file" },
          { label: "Customers w/ Files", value: partnersWithFiles.toLocaleString(), icon: "fa-users" },
          { label: "Avg per Customer", value: partnersWithFiles > 0 ? formatBytes(totalStorage / partnersWithFiles) : "0 B", icon: "fa-chart-simple" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel rounded-2xl border border-outline-variant/15 p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {s.label}
              </span>
              <i className={`fa-solid ${s.icon} text-primary/40`} />
            </div>
            <p className="text-2xl font-extrabold text-on-surface font-headline">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Global file type breakdown */}
      <section className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Storage by File Type
          </h2>
        </div>
        <div className="p-6">
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-on-surface-variant/60 text-center py-4">
              No files uploaded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, data]) => {
                const pct = totalStorage > 0 ? (data.bytes / totalStorage) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <div className="w-28 shrink-0 flex items-center gap-2">
                      <i
                        className={`fa-solid ${CATEGORY_ICONS[cat] ?? "fa-file"} text-sm ${CATEGORY_COLORS[cat] ?? "text-on-surface-variant/60"}`}
                      />
                      <span className="text-sm font-medium text-on-surface">{cat}</span>
                    </div>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                    <div className="w-24 text-right shrink-0">
                      <span className="text-sm font-bold text-on-surface">
                        {formatBytesShort(data.bytes)}
                      </span>
                    </div>
                    <div className="w-20 text-right shrink-0">
                      <span className="text-xs text-on-surface-variant/60">
                        {data.count} file{data.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Per-customer storage table */}
      <section className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Storage by Customer
          </h2>
          <span className="text-xs text-on-surface-variant/40">
            {sorted.length} customer{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="divide-y divide-outline-variant/5">
          {sorted.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-on-surface-variant/60">
              <i className="fa-solid fa-hard-drive text-3xl text-on-surface-variant/20 mb-3 block" />
              No customers found.
            </div>
          )}
          {sorted.map((p) => {
            const badge = TIER_BADGES[p.planTier] ?? TIER_BADGES.free;
            const limit = TIER_STORAGE_LIMITS[p.planTier];
            const usageRatio = limit ? Math.min(1, p.totalBytes / limit) : 0;
            const isNearLimit = usageRatio > 0.8;
            const isOverLimit = usageRatio >= 1;

            // Sort this partner's categories by bytes descending
            const partnerCats = Object.entries(p.categories).sort(
              ([, a], [, b]) => b.bytes - a.bytes,
            );

            return (
              <div key={p.partnerId} className="px-6 py-4 hover:bg-on-surface/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {p.logoUrl ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <Image src={p.logoUrl} alt="" fill className="object-contain" sizes="40px" />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-on-primary text-sm font-bold shrink-0"
                      style={{ backgroundColor: p.primaryColor || "#696cf8" }}
                    >
                      {p.partnerName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  {/* Name + usage bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/partners/${p.partnerId}`}
                        className="text-sm font-bold text-on-surface hover:text-primary transition-colors truncate"
                      >
                        {p.partnerName}
                      </Link>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {/* Storage progress bar */}
                    {limit ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverLimit
                                ? "bg-red-500"
                                : isNearLimit
                                  ? "bg-amber-400"
                                  : "bg-primary"
                            }`}
                            style={{ width: `${Math.max(usageRatio * 100, 0.5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant/60 shrink-0">
                          {formatBytesShort(p.totalBytes)} / {formatBytesShort(limit)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant/60">
                        {formatBytesShort(p.totalBytes)} used -- unlimited
                      </span>
                    )}
                  </div>

                  {/* File count */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-on-surface">{p.fileCount}</p>
                    <p className="text-[10px] text-on-surface-variant/60">
                      file{p.fileCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Category breakdown (only show if they have files) */}
                {partnerCats.length > 0 && (
                  <div className="mt-3 ml-14 flex flex-wrap gap-3">
                    {partnerCats.map(([cat, data]) => (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60"
                      >
                        <i
                          className={`fa-solid ${CATEGORY_ICONS[cat] ?? "fa-file"} ${CATEGORY_COLORS[cat] ?? "text-on-surface-variant/40"} text-[10px]`}
                        />
                        <span>
                          {cat}: {formatBytesShort(data.bytes)} ({data.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
