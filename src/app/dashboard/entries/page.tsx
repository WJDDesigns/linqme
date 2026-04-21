import { requireSession, getCurrentAccount, getVisiblePartners } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import EntriesList from "./EntriesList";

export default async function EntriesPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Entries</h1>
        <p className="text-sm text-on-surface-variant mt-2">No workspace is associated with your account yet.</p>
      </div>
    );
  }

  const admin = createAdminClient();

  // Load all submissions for this partner
  const [{ data: submissions }, { data: forms }, { data: partner }, { data: aiIntegrations }, { data: cachedOverviews }] =
    await Promise.all([
      admin
        .from("submissions")
        .select(
          `id, status, client_name, client_email, submitted_at, created_at, form_slug,
           partner_form_id,
           partners ( id, name, slug, primary_color, logo_url ),
           partner_forms ( id, name )`,
        )
        .eq("partner_id", account.id)
        .order("created_at", { ascending: false })
        .limit(500),
      admin
        .from("partner_forms")
        .select("id, slug, name")
        .eq("partner_id", account.id)
        .order("name"),
      admin
        .from("partners")
        .select("settings, parent_partner_id")
        .eq("id", account.id)
        .maybeSingle(),
      admin
        .from("ai_integrations")
        .select("id")
        .eq("partner_id", account.id)
        .limit(1),
      admin
        .from("smart_overview_cache")
        .select("partner_form_id, overview_html, generated_at, entry_count")
        .eq("partner_id", account.id),
    ]);

  const rows = (submissions ?? []).map((s) => {
    const pf = Array.isArray(s.partner_forms) ? s.partner_forms[0] : s.partner_forms;
    return {
      id: s.id as string,
      status: s.status as string,
      client_name: (s.client_name as string) ?? null,
      client_email: (s.client_email as string) ?? null,
      submitted_at: (s.submitted_at as string) ?? null,
      created_at: s.created_at as string,
      partner_form_id: (s.partner_form_id as string) ?? null,
      form_slug: (s.form_slug as string) ?? null,
      form_name: (pf as { id: string; name: string } | null)?.name ?? null,
    };
  });

  const formOptions = (forms ?? []).map((f) => ({
    id: f.id as string,
    slug: f.slug as string,
    name: f.name as string,
  }));

  // Smart overview check
  const partnerSettings = (partner?.settings as Record<string, unknown>) ?? {};
  const smartOverviewEnabled = partnerSettings.smart_overview_enabled === true;
  const hasAiProvider = (aiIntegrations ?? []).length > 0;
  const showSmartOverview = smartOverviewEnabled && hasAiProvider;

  // Build map of form ID -> cached overview
  const overviewMap: Record<string, { overview: string; generatedAt: string; entryCount: number }> = {};
  if (cachedOverviews) {
    for (const c of cachedOverviews) {
      overviewMap[c.partner_form_id as string] = {
        overview: c.overview_html as string,
        generatedAt: c.generated_at as string,
        entryCount: c.entry_count as number,
      };
    }
  }

  const isSuperadmin = session.role === "superadmin";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-headline tracking-tight text-on-surface">Entries</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          All form submissions across your forms.
        </p>
      </header>

      <EntriesList
        submissions={rows}
        forms={formOptions}
        isSuperadmin={isSuperadmin}
        showSmartOverview={showSmartOverview}
        overviewMap={overviewMap}
      />
    </div>
  );
}
