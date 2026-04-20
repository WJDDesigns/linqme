import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import IntegrationsSection from "../settings/IntegrationsSection";
import AIIntegrationsSection from "../settings/AIIntegrationsSection";
import PaymentIntegrationsSection from "../settings/PaymentIntegrationsSection";
import CaptchaIntegrationsSection from "../settings/CaptchaIntegrationsSection";
import GeocodingIntegrationsSection from "../settings/GeocodingIntegrationsSection";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
          Integrations
        </h1>
        <p className="text-on-surface-variant mt-2">
          No workspace is associated with your account yet.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();

  const [
    { data: cloudIntegrations },
    { data: aiIntegrationRows },
    { data: paymentIntegrationRows },
    { data: captchaIntegrationRows },
    geocodingResult,
    { data: partner },
  ] = await Promise.all([
    admin
      .from("cloud_integrations")
      .select("id, provider, account_email, connected_at")
      .eq("partner_id", account.id),
    admin
      .from("ai_integrations")
      .select("id, provider, model_preference, connected_at")
      .eq("partner_id", account.id),
    admin
      .from("payment_integrations")
      .select("id, provider, connected_at, account_email, stripe_account_id")
      .eq("partner_id", account.id),
    admin
      .from("captcha_integrations")
      .select("id, provider, connected_at")
      .eq("partner_id", account.id),
    Promise.resolve(
      admin
        .from("geocoding_integrations")
        .select("id, provider, connected_at")
        .eq("partner_id", account.id),
    ).catch(() => ({ data: null, error: null, count: null, status: 200, statusText: "OK" })),
    admin
      .from("partners")
      .select("default_geocoding_provider")
      .eq("id", account.id)
      .maybeSingle(),
  ]);

  const geocodingIntegrationRows: { id: string; provider: string; connected_at: string }[] =
    (geocodingResult?.data ?? []) as { id: string; provider: string; connected_at: string }[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
            Integrations
          </h1>
          <p className="text-on-surface-variant mt-1">
            Connect cloud storage, AI, payment, and security providers.
          </p>
        </header>

        <IntegrationsSection integrations={cloudIntegrations ?? []} />
        <AIIntegrationsSection aiIntegrations={aiIntegrationRows ?? []} />
        <PaymentIntegrationsSection integrations={paymentIntegrationRows ?? []} />
        <CaptchaIntegrationsSection integrations={captchaIntegrationRows ?? []} />
        <GeocodingIntegrationsSection
          integrations={geocodingIntegrationRows}
          defaultProvider={partner?.default_geocoding_provider as "google" | "openstreetmap" | undefined}
        />
      </div>
    </div>
  );
}
