/**
 * Branded HTML email template wrapper for SiteLaunch emails.
 * Provides consistent styling across all outgoing emails.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface TemplateOptions {
  /** Main heading text */
  heading: string;
  /** Body content (raw HTML) */
  body: string;
  /** Optional CTA button */
  cta?: { label: string; url: string };
  /** Footer text — defaults to SiteLaunch branding */
  footer?: string;
  /** Optional partner name for "on behalf of" line */
  partnerName?: string;
}

/**
 * Wraps email content in a branded, responsive HTML template.
 * Uses inline styles for maximum email client compatibility.
 */
export function emailTemplate(opts: TemplateOptions): string {
  const footerText = opts.partnerName
    ? `Sent from SiteLaunch on behalf of ${escapeHtml(opts.partnerName)}.`
    : opts.footer ?? "Sent from SiteLaunch.";

  const ctaBlock = opts.cta
    ? `
      <tr>
        <td style="padding: 24px 0 0;">
          <a href="${opts.cta.url}"
             style="display: inline-block; background: #696cf8; color: #ffffff; text-decoration: none;
                    padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px;
                    letter-spacing: 0.02em;">
            ${escapeHtml(opts.cta.label)}
          </a>
        </td>
      </tr>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f8;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%;">
          <!-- Logo -->
          <tr>
            <td style="padding: 0 0 24px; text-align: center;">
              <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">SiteLaunch</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 0 16px;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                      ${escapeHtml(opts.heading)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="color: #475569; font-size: 15px; line-height: 1.6;">
                    ${opts.body}
                  </td>
                </tr>
                ${ctaBlock}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                ${escapeHtml(footerText)}<br />
                Need help? Reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export { escapeHtml };
