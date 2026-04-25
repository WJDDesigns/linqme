import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ subdomain: string; token: string }>;
}

const LOGO_DIMS: Record<string, { wrapper: string; img: string; fallback: string }> = {
  default: { wrapper: "h-10 rounded-xl", img: "h-8 w-auto", fallback: "w-10 h-10 rounded-xl" },
  large: { wrapper: "h-16 rounded-2xl", img: "h-14 w-auto", fallback: "w-16 h-16 rounded-2xl" },
  "full-width": { wrapper: "h-14 rounded-2xl", img: "h-12 w-auto", fallback: "h-14 px-4 rounded-2xl" },
};

export default async function ThanksPage({ params }: Props) {
  const { subdomain, token } = await params;
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("submissions")
    .select(
      `id, status, submitted_at, client_name, partner_form_id,
       partners ( slug, name, custom_domain, logo_url, primary_color, support_email, plan_tier, hide_branding, custom_footer_text, logo_size, theme_mode ),
       partner_forms!partner_form_id ( name, slug, is_default, confirm_page_heading, confirm_page_body, success_heading, success_message, success_redirect_url )`,
    )
    .eq("access_token", token)
    .maybeSingle();

  if (!sub) notFound();
  const partner = Array.isArray(sub.partners) ? sub.partners[0] : sub.partners;
  if (!partner) notFound();
  const form = Array.isArray(sub.partner_forms) ? sub.partner_forms[0] : sub.partner_forms;

  const primary = partner.primary_color || "#c0c1ff";
  const isPaid = (partner as Record<string, unknown>).plan_tier !== "free";
  const hideBranding = isPaid && (partner as Record<string, unknown>).hide_branding;
  const footerText = isPaid && (partner as Record<string, unknown>).custom_footer_text
    ? String((partner as Record<string, unknown>).custom_footer_text)
    : null;
  const logoSize = String((partner as Record<string, unknown>).logo_size ?? "default");
  const dims = LOGO_DIMS[logoSize] ?? LOGO_DIMS.default;
  const isFullWidth = logoSize === "full-width";

  // Build the form name and custom confirmation text
  // success_* columns (from Settings) take precedence over confirm_page_* (from Send To)
  const formName = form?.name ?? "submission";
  const successHeading = (form as Record<string, unknown>)?.success_heading ? String((form as Record<string, unknown>).success_heading) : null;
  const successMessage = (form as Record<string, unknown>)?.success_message ? String((form as Record<string, unknown>).success_message) : null;
  const successRedirectUrl = (form as Record<string, unknown>)?.success_redirect_url ? String((form as Record<string, unknown>).success_redirect_url) : null;
  const customHeading = successHeading ?? (form?.confirm_page_heading ? String(form.confirm_page_heading) : null);
  const customBody = successMessage ?? (form?.confirm_page_body ? String(form.confirm_page_body) : null);

  // If a redirect URL is configured, redirect immediately
  if (successRedirectUrl) {
    redirect(successRedirectUrl);
  }

  // Logo link: go to the hub page (storefront root) or the default form
  const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linqme.io").replace(/:\d+$/, "");
  const storefrontHost = partner.custom_domain || `${subdomain}.${rootHost}`;
  const logoHref = `https://${storefrontHost}/`;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl ${isFullWidth ? "flex flex-col items-center px-8 py-4" : "flex items-center px-8 py-6"}`}>
        <Link href={logoHref} className="transition-opacity hover:opacity-80">
          {isFullWidth ? (
            <div className="flex flex-col items-center gap-1">
              {partner.logo_url ? (
                <Image src={partner.logo_url} alt={partner.name} width={200} height={48} className="h-12 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary }}>
                  <span className="text-on-primary font-bold text-xl">{partner.name.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <span className="text-sm font-bold text-on-surface font-headline tracking-tight">{partner.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {partner.logo_url ? (
                <div className={`${dims.wrapper} flex items-center justify-center`}>
                  <Image src={partner.logo_url} alt={partner.name} width={200} height={80} className={`${dims.img} object-contain`} />
                </div>
              ) : (
                <div className={`${dims.fallback} flex items-center justify-center`} style={{ backgroundColor: primary }}>
                  <span className="text-on-primary font-bold text-lg">{partner.name.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <span className="text-lg font-bold text-on-surface font-headline tracking-tight">{partner.name}</span>
            </div>
          )}
        </Link>
      </header>

      {/* Content */}
      <section className={`flex-1 flex items-center justify-center px-6 ${isFullWidth ? "pt-28 pb-20" : "pt-32 pb-20"}`}>
        <div className="text-center space-y-6 animate-fade-up">
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primary}18` }}
          >
            <i className="fa-solid fa-check text-3xl" style={{ color: primary }} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface tracking-tight">
              {customHeading
                ? customHeading
                : sub.client_name ? `Thanks, ${sub.client_name.split(" ")[0]}!` : "All done!"}
            </h1>
            <p className="text-on-surface-variant mt-2 text-lg leading-relaxed">
              {customBody
                ? customBody
                : `Your ${formName} has been submitted to ${partner.name}. They\u2019ll be in touch soon.`}
            </p>
          </div>
          {partner.support_email && (
            <p className="text-sm text-on-surface-variant/60 pt-4">
              Questions? Email{" "}
              <a href={`mailto:${partner.support_email}`} className="text-primary hover:underline">
                {partner.support_email}
              </a>
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col items-center gap-4 border-t border-on-surface/10">
        {hideBranding ? (
          footerText ? (
            <p className="text-xs text-on-surface/40">{footerText}</p>
          ) : null
        ) : (
          <>
            {footerText ? (
              <p className="text-xs text-on-surface/60">{footerText}</p>
            ) : null}
            <span className="text-sm font-bold text-on-surface font-headline">linqme</span>
            <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface/40">
              &copy; {new Date().getFullYear()} linqme &middot; WJD Designs
            </p>
          </>
        )}
      </footer>
    </main>
  );
}
