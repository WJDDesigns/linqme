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
    name: "Free",
    price: "$0 / mo",
    submissions: "1 submission / month",
    features: ["Your own branded workspace", "Unlimited form fields", "File uploads"],
    cta: "Your current plan",
  },
  {
    tier: "paid",
    name: "Agency",
    price: "Contact us",
    submissions: "10 submissions / month",
    features: ["Everything in Free", "Custom domain", "Branded emails"],
    cta: "Contact sales",
    highlight: true,
  },
  {
    tier: "unlimited",
    name: "Agency Unlimited",
    price: "Contact us",
    submissions: "Unlimited submissions",
    features: ["Everything in Agency", "Priority support", "API access (coming)"],
    cta: "Contact sales",
  },
];

const PARTNERS_TIERS: TierCard[] = [
  {
    tier: "free",
    name: "Free (with partners)",
    price: "$0 / mo",
    submissions: "1 submission / month across all sub-partners",
    features: ["Up to 2 sub-partners", "Shared quota across tree"],
    cta: "Your current plan",
  },
  {
    tier: "paid",
    name: "Agency + Partners",
    price: "Contact us",
    submissions: "10 submissions / month shared",
    features: ["Up to 10 sub-partners", "Per-partner branding", "Roll-up submissions view"],
    cta: "Contact sales",
    highlight: true,
  },
  {
    tier: "unlimited",
    name: "Partner Unlimited",
    price: "Contact us",
    submissions: "Unlimited submissions & sub-partners",
    features: ["Everything in Agency + Partners", "White-label dashboard polish", "Dedicated success contact"],
    cta: "Contact sales",
  },
];

export default async function BillingPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">Billing &amp; plan</h1>
        <p className="text-sm text-slate-600 mt-2">
          No workspace is associated with your account yet.
        </p>
      </div>
    );
  }

  const usage = await getAccountUsage(account.id);
  const tiers = account.planType === "agency" ? AGENCY_TIERS : PARTNERS_TIERS;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing &amp; plan</h1>
        <p className="text-sm text-slate-600 mt-1">
          {account.planType === "agency"
            ? "Agency plans — use SiteLaunch for your own clients."
            : "Agency + Partners plans — spin up sub-partner workspaces under your master account."}
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Current plan
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900 capitalize">
              {account.planTier}
            </div>
            <div className="text-sm text-slate-600 mt-0.5">
              {usage}
              {account.submissionsMonthlyLimit !== null
                ? ` / ${account.submissionsMonthlyLimit}`
                : ""}{" "}
              submissions used this month
            </div>
          </div>
          <a
            href={`mailto:hello@mysitelaunch.com?subject=Upgrade%20${account.slug}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Contact sales →
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => {
          const isCurrent = t.tier === account.planTier;
          return (
            <div
              key={t.tier}
              className={`rounded-2xl border p-5 ${
                t.highlight
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`text-xs uppercase tracking-wide ${
                  t.highlight ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {t.name}
              </div>
              <div className="mt-1 text-2xl font-bold">{t.price}</div>
              <div
                className={`text-sm mt-1 ${
                  t.highlight ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {t.submissions}
              </div>
              <ul
                className={`mt-4 space-y-1.5 text-sm ${
                  t.highlight ? "text-slate-100" : "text-slate-700"
                }`}
              >
                {t.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <div
                    className={`text-xs font-medium ${
                      t.highlight ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Your current plan
                  </div>
                ) : (
                  <a
                    href={`mailto:hello@mysitelaunch.com?subject=Upgrade%20${account.slug}%20to%20${t.name}`}
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      t.highlight
                        ? "bg-white text-slate-900 hover:bg-slate-100"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {t.cta} →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-slate-500">
        Self-serve upgrades via Stripe are coming soon. In the meantime email{" "}
        <a className="underline" href="mailto:hello@mysitelaunch.com">
          hello@mysitelaunch.com
        </a>{" "}
        and we&apos;ll move your account to the next tier manually.
      </p>

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Email notifications
        </h2>
        <p className="text-xs text-slate-600 mb-3">
          We use Resend to notify you when a client submits. Send a test
          message to confirm your setup.
        </p>
        <TestEmailButton />
      </section>
    </div>
  );
}
