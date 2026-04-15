import { getPlans } from "@/lib/plans";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";
import Link from "next/link";
import SiteLaunchLogo from "@/components/SiteLaunchLogo";

export interface PartnerProfile {
  phone: string;
  website: string;
  industry: string;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
  billing_country: string;
  team_size: string;
  expected_monthly_clients: string;
  referral_source: string;
  tax_id: string;
}

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { plan: selectedPlan } = await searchParams;
  // Preserve the checkout URL so user returns here after login/signup
  const redirectTo = selectedPlan ? `/checkout?plan=${selectedPlan}` : "/checkout";
  const session = await requireSession(redirectTo);
  const plans = await getPlans();
  const paidPlans = plans.filter((p) => p.priceMonthly > 0);

  // Fetch existing partner profile data to pre-fill or detect missing fields
  const account = await getCurrentAccount(session.userId);
  let partnerProfile: PartnerProfile | null = null;

  if (account) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("partners")
      .select("phone, website, industry, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip, billing_country, team_size, expected_monthly_clients, referral_source, tax_id")
      .eq("id", account.id)
      .maybeSingle();

    if (data) {
      partnerProfile = {
        phone: data.phone ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        billing_address_line1: data.billing_address_line1 ?? "",
        billing_address_line2: data.billing_address_line2 ?? "",
        billing_city: data.billing_city ?? "",
        billing_state: data.billing_state ?? "",
        billing_zip: data.billing_zip ?? "",
        billing_country: data.billing_country ?? "US",
        team_size: data.team_size ?? "",
        expected_monthly_clients: data.expected_monthly_clients ?? "",
        referral_source: data.referral_source ?? "",
        tax_id: data.tax_id ?? "",
      };
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="gradient-mesh fixed inset-0 -z-10" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-glow-breathe" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <SiteLaunchLogo className="h-7 w-auto text-primary" ringClassName="text-on-surface/70" />
          <span className="text-lg font-extrabold font-headline text-on-surface tracking-tight">
            SiteLaunch
          </span>
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-[10px] mr-1" /> Back to Pricing
        </Link>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 md:px-10 pb-20">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface">
            Complete Your Upgrade
          </h1>
          <p className="text-sm text-on-surface-variant/60 mt-2">
            Fill in your business details, choose your plan, and apply a coupon if you have one.
          </p>
        </header>

        <CheckoutForm
          plans={paidPlans}
          defaultPlan={selectedPlan}
          partnerProfile={partnerProfile}
          partnerId={account?.id ?? null}
        />
      </main>
    </div>
  );
}
