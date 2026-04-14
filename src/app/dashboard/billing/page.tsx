import { requireSession, getCurrentAccount, getAccountUsage } from "@/lib/auth";
import TestEmailButton from "./TestEmailButton";

interface TierCard {
  tier: "free" | "paid" | "unlimited";
  name: string;
  price: string;
  submissions: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const AGENCY_TIERS: TierCard[] = [
  {
    tier: "free",
    name: "Starlink",
    price: "Free",
    submissions: "1 submission / month",
    features: ["Your own branded workspace", "Unlimited form fields", "File uploads"],
    cta: "Your current plan",
  },
  {
    tier: "paid",
    name: "Supernova",
    price: "$149/mo",
    submissions: "Unlimited submissions",
    features: ["Everything in Starlink", "Custom domain", "Branded emails", "Full white-labeling"],
    cta: "Contact sales",
    highlight: true,
  },
  {
    tier: "unlimited",
    name: "Galactic",
    price: "$399/mo",
    submissions: "Unlimited submissions",
    features: ["Everything in Supernova", "Priority support", "API access (coming)"],
    cta: "Contact sales",
  },
];

const PARTNERS_TIERS: TierCard[] = [
  {
    tier: "free",
    name: "Starlink (with partners)",
    price: "Free",
    submissions: "1 submission / month across all sub-partners",
    features: ["Up to 2 sub-partners", "Shared quota across tree"],
    cta: "Your current plan",
  },
  {
    tier: "paid",
    name: "Supernova + Partners",
    price: "$149/mo",
    submissions: "Unlimited submissions shared",
    features: ["Up to 10 sub-partners", "Per-partner branding", "Roll-up submissions view"],
    cta: "Contact sales",
    highlight: true,
  },
  {
    tier: "unlimited",
    name: "Galactic Partners",
    price: "$399/mo",
    submissions: "Unlimited submissions & sub-partners",
    features: ["Everything in Supernova + Partners", "White-label dashboard polish", "Dedicated success contact"],
    cta: "Contact sales",
  },
];

export default async function BillingPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Settings</h1>
        <p className="text-on-surface-variant mt-2">
          No workspace is associated with your account yet.
        </p>
      </div>
    );
  }

  const usage = await getAccountUsage(account.id);
  const tiers = account.planType === "agency" ? AGENCY_TIERS : PARTNERS_TIERS;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Settings &amp; Plan</h1>
        <p className="text-on-surface-variant mt-1">
          {account.planType === "agency"
            ? "Agency plans \u2014 use SiteLaunch for your own clients."
            : "Agency + Partners plans \u2014 spin up sub-partner workspaces under your master account."}
        </p>
      </header>

      <section className="glass-panel rounded-2xl border border-outline-variant/15 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-label">
              Current plan
            </div>
            <div className="mt-1 text-xl font-bold text-on-surface font-headline capitalize">
              {account.planTier}
            </div>
            <div className="text-sm text-on-surface-variant mt-0.5">
              {usage}
              {account.submissionsMonthlyLimit !== null
                ? ` / ${account.submissionsMonthlyLimit}`
                : ""}{" "}
              submissions used this month
            </div>
          </div>
          <a
            href={`mailto:hello@mysitelaunch.com?subject=Upgrade%20${account.slug}`}
            className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all"
          >
            Contact sales <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t) => {
          const isCurrent = t.tier === account.planTier;
          return (
            <div
              key={t.tier}
              className={`rounded-2xl p-6 flex flex-col ${
                t.highlight
                  ? "glass-panel border-2 border-primary relative scale-105 z-10 shadow-2xl"
                  : "bg-surface-container-low border border-outline-variant/10"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-label">
                {t.name}
              </div>
              <div className={`mt-1 text-3xl font-bold font-headline ${t.highlight ? "text-primary" : ""}`}>{t.price}</div>
              <div className="text-sm mt-1 text-on-surface-variant">
                {t.submissions}
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-grow">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-tertiary text-xs" />
                    <span className="text-on-surface-variant">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div className="text-xs font-medium text-on-surface-variant/60">
                    Your current plan
                  </div>
                ) : (
                  <a
                    href={`mailto:hello@mysitelaunch.com?subject=Upgrade%20${account.slug}%20to%20${t.name}`}
                    className={`inline-block w-full text-center rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                      t.highlight
                        ? "bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(192,193,255,0.4)]"
                        : "border border-outline-variant/30 hover:bg-surface-variant/30"
                    }`}
                  >
                    {t.cta} <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-on-surface-variant/60">
        Self-serve upgrades via Stripe are coming soon. In the meantime email{" "}
        <a className="text-primary hover:underline" href="mailto:hello@mysitelaunch.com">
          hello@mysitelaunch.com
        </a>{" "}
        and we&apos;ll move your account to the next tier manually.
      </p>

      <section className="glass-panel rounded-2xl border border-outline-variant/15 p-6">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
          Email notifications
        </h2>
        <p className="text-xs text-on-surface-variant/60 mb-3">
          We use Resend to notify you when a client submits. Send a test
          message to confirm your setup.
        </p>
        <TestEmailButton />
      </section>
    </div>
  );
}
