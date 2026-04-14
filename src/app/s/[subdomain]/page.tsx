import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { startSubmissionAction } from "./actions";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export default async function PartnerHomePage({ params }: Props) {
  const { subdomain } = await params;
  const identifier = decodeURIComponent(subdomain);

  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, slug, name, custom_domain, logo_url, primary_color, accent_color, support_email")
    .or(`slug.eq.${identifier},custom_domain.eq.${identifier}`)
    .maybeSingle();

  if (!partner) return notFound();

  const primary = partner.primary_color || "#c0c1ff";

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {partner.logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${primary}20` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary }}>
              <span className="text-on-primary font-bold">{partner.name.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-on-surface font-headline tracking-tight">{partner.name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: `${primary}99` }}>Client Onboarding Portal</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 max-w-4xl mx-auto text-center relative">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface max-w-2xl leading-tight">
            Welcome to {partner.name} onboarding
          </h1>
          <p className="text-lg text-on-surface-variant font-body leading-relaxed max-w-xl mx-auto">
            Let&apos;s get your project started. This form takes about 10 minutes and you can come back to it anytime with your unique link.
          </p>
          <form action={startSubmissionAction} className="pt-4">
            <input type="hidden" name="partner_id" value={partner.id} />
            <input type="hidden" name="subdomain" value={identifier} />
            <button
              type="submit"
              className="px-10 py-4 text-on-primary font-headline font-bold rounded-xl shadow-[0_10px_30px_rgba(192,193,255,0.2)] hover:shadow-[0_15px_40px_rgba(192,193,255,0.35)] hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
              style={{ backgroundColor: primary }}
            >
              Start onboarding
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>
          {partner.support_email && (
            <p className="text-xs text-on-surface-variant/60 pt-4">
              Questions? <a href={`mailto:${partner.support_email}`} className="text-primary hover:underline">{partner.support_email}</a>
            </p>
          )}
        </div>

        {/* Background glows */}
        <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${primary}08` }} />
        <div className="fixed top-1/4 -left-20 w-64 h-64 bg-tertiary/5 rounded-full blur-[80px] pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col items-center gap-4 border-t border-on-surface/10">
        <span className="text-sm font-bold text-on-surface font-headline">SiteLaunch</span>
        <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface/40">
          &copy; {new Date().getFullYear()} SiteLaunch. The Cosmic Curator.
        </p>
      </footer>
    </main>
  );
}
