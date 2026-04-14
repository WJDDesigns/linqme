import Link from "next/link";
import { requireSession, getCurrentAccount, getAccountUsage } from "@/lib/auth";

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  paid: "Paid",
  unlimited: "Unlimited",
  enterprise: "Enterprise",
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/dashboard/form", label: "Form Builder", icon: "form" },
  { href: "/dashboard/submissions", label: "Submissions", icon: "inbox" },
  { href: "/dashboard/billing", label: "Settings", icon: "settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const isAdmin = session.role === "superadmin";
  const account = await getCurrentAccount(session.userId);
  const showPartners = isAdmin || account?.planType === "agency_plus_partners";

  let usageLine: string | null = null;
  let usageRatio = 0;
  if (account) {
    const used = await getAccountUsage(account.id);
    const limit = account.submissionsMonthlyLimit;
    if (limit === null) {
      usageLine = `${used} submissions this month`;
      usageRatio = 0;
    } else {
      usageLine = `${used} / ${limit} submissions`;
      usageRatio = limit > 0 ? Math.min(1, used / limit) : 1;
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen fixed left-0 border-r border-on-surface/10 bg-background z-40">
        {/* Logo */}
        <div className="px-6 py-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-inverse-primary flex items-center justify-center">
              <span className="text-surface text-sm font-bold">S</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface font-headline tracking-tight">
                {isAdmin ? "SiteLaunch" : (account?.name ?? "SiteLaunch")}
              </h2>
              <p className="text-[10px] text-primary/60 uppercase tracking-widest font-semibold">
                {account ? (TIER_LABELS[account.planTier] ?? account.planTier) : "Platform"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-on-surface/60 hover:bg-on-surface/5 hover:text-on-surface transition-all duration-200 rounded-lg text-sm font-medium"
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
          {showPartners && (
            <Link
              href="/dashboard/partners"
              className="flex items-center gap-3 px-4 py-3 text-on-surface/60 hover:bg-on-surface/5 hover:text-on-surface transition-all duration-200 rounded-lg text-sm font-medium"
            >
              <NavIcon name="partners" />
              {isAdmin ? "Partners" : "Sub-partners"}
            </Link>
          )}
        </nav>

        {/* Usage meter */}
        {usageLine && (
          <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-surface-container-low">
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-1 font-label">
              Usage
            </div>
            <div className="text-xs text-on-surface">{usageLine}</div>
            {account?.submissionsMonthlyLimit !== null && (
              <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-primary transition-all rounded-full"
                  style={{ width: `${Math.round(usageRatio * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-on-surface/5 px-3 py-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-primary">
              {(session.fullName || session.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {session.fullName || session.email}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">{session.email}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="px-3 mt-1">
            <button className="text-xs text-on-surface-variant/40 hover:text-primary transition-colors uppercase tracking-widest">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    grid: "M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z",
    form: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4",
    inbox: "M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    partners: "M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  };
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] ?? icons.grid} />
    </svg>
  );
}
