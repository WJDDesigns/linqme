/**
 * Send a welcome email when someone completes signup.
 */
export async function sendWelcomeEmail(args: {
  to: string;
  companyName: string;
  slug: string;
  planType: "agency" | "agency_plus_partners";
}): Promise<void> {
  const appUrlRoot =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mysitelaunch.com";
  const storefrontRoot = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "mysitelaunch.com"
  ).replace(/:\d+$/, "");
  const storefrontUrl =
    process.env.NODE_ENV === "production"
      ? `https://${args.slug}.${storefrontRoot}`
      : `http://${args.slug}.${storefrontRoot}${process.env.NEXT_PUBLIC_ROOT_DOMAIN?.match(/:(\d+)$/)?.[0] ?? ""}`;
  const dashboardUrl = `${appUrlRoot.replace(/\/$/, "")}/dashboard`;

  const planLine =
    args.planType === "agency_plus_partners"
      ? "Your Agency + Partners workspace is ready — you can spin up sub-partners whenever you want."
      : "Your Agency workspace is ready.";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; max-width: 560px;">
      <h2 style="margin: 0 0 12px;">Welcome to SiteLaunch, ${escapeHtml(args.companyName)} 👋</h2>
      <p style="margin: 0 0 8px; color: #475569;">${escapeHtml(planLine)}</p>
      <p style="margin: 0 0 16px; color: #475569;">
        Your client-facing storefront lives at
        <a href="${storefrontUrl}" style="color: #0f172a;">${storefrontUrl.replace(/^https?:\/\//, "")}</a>.
      </p>
      <a href="${dashboardUrl}"
         style="display: inline-block; background: #0f172a; color: #fff; text-decoration: none;
                padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Open dashboard →
      </a>
      <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px;">
        Need help? Reply to this email.
      </p>
    </div>
  `;

  await sendMail({
    to: args.to,
    subject: "Welcome to SiteLaunch",
    html,
  });
}

/**
 * Higher-level notification helpers that compose data + email templates.
 *
 * These use the service-role client because they run from contexts where
 * RLS would otherwise block access to another user's rows (e.g. the
 * anonymous client submitting a form).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl(path: string): string {
  const root = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.mysitelaunch.com";
  return `${root.replace(/\/$/, "")}${path}`;
}

/**
 * Resolve the email address to notify for a given partner.
 * Priority: partner.support_email → first partner_owner's profile email.
 */
async function resolvePartnerNotifyEmails(
  partnerId: string,
): Promise<string[]> {
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("support_email")
    .eq("id", partnerId)
    .maybeSingle();

  if (partner?.support_email) return [partner.support_email];

  // Fallback: all partner_owners on this partner
  const { data: owners } = await admin
    .from("partner_members")
    .select("user_id")
    .eq("partner_id", partnerId)
    .eq("role", "partner_owner");

  if (!owners || owners.length === 0) return [];

  const userIds = owners.map((o) => o.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("email")
    .in("id", userIds);

  return (profiles ?? [])
    .map((p) => p.email)
    .filter((e): e is string => !!e);
}

/**
 * Called when a client finalizes (submits) their onboarding.
 * Sends a notification email to the partner's team + a confirmation to the client.
 */
export async function notifyPartnerOfSubmission(submissionId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("submissions")
    .select("id, client_name, client_email, data, partner_id, submitted_at")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return;

  const { data: partner } = await admin
    .from("partners")
    .select("id, name, slug, support_email")
    .eq("id", sub.partner_id)
    .maybeSingle();
  if (!partner) return;

  const partnerEmails = await resolvePartnerNotifyEmails(sub.partner_id);

  const clientName = sub.client_name || "A client";
  const clientEmail = sub.client_email || "(no email provided)";
  const dashboardLink = appUrl(`/dashboard/submissions/${sub.id}`);

  // --- Partner notification ------------------------------------------------
  if (partnerEmails.length > 0) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">New submission for ${escapeHtml(partner.name)}</h2>
        <p style="margin: 0 0 8px; color: #475569;">
          <strong>${escapeHtml(clientName)}</strong> just submitted their onboarding form.
        </p>
        <p style="margin: 0 0 16px; color: #475569;">Client email: ${escapeHtml(clientEmail)}</p>
        <a href="${dashboardLink}"
           style="display: inline-block; background: #0f172a; color: #fff; text-decoration: none;
                  padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          View submission →
        </a>
        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px;">
          Sent from SiteLaunch on behalf of ${escapeHtml(partner.name)}.
        </p>
      </div>
    `;
    await sendMail({
      to: partnerEmails,
      subject: `New submission · ${clientName} · ${partner.name}`,
      html,
      replyTo: sub.client_email || undefined,
    });
  }

  // --- Client confirmation -------------------------------------------------
  if (sub.client_email) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; max-width: 560px;">
        <h2 style="margin: 0 0 12px;">Thanks, ${escapeHtml(clientName)} — we got it!</h2>
        <p style="margin: 0 0 8px; color: #475569;">
          Your onboarding info has been received by ${escapeHtml(partner.name)}.
          They'll reach out with next steps shortly.
        </p>
        <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
          Sent from SiteLaunch on behalf of ${escapeHtml(partner.name)}.
        </p>
      </div>
    `;
    await sendMail({
      to: sub.client_email,
      subject: `We received your onboarding info · ${partner.name}`,
      html,
      replyTo: partner.support_email || undefined,
    });
  }
}
