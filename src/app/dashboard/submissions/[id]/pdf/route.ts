import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormSchema, FieldDef } from "@/lib/forms";
import { formatFieldValue } from "@/lib/format-field-value";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Lighten a hex color by mixing it with white.
 * amount: 0 = original, 1 = white
 */
function lighten(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requireSession();
    const supabase = await createClient();

    const { data: sub, error } = await supabase
      .from("submissions")
      .select(
        `id, status, data, client_name, client_email, submitted_at, created_at,
         partners ( id, name, slug, primary_color, accent_color, logo_url, parent_partner_id ),
         partner_forms ( id, form_templates ( schema ) )`,
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const partner = Array.isArray(sub.partners) ? sub.partners[0] : sub.partners;
    const pf = Array.isArray(sub.partner_forms) ? sub.partner_forms[0] : sub.partner_forms;
    const tpl = pf && (Array.isArray(pf.form_templates) ? pf.form_templates[0] : pf.form_templates);
    const schema = tpl?.schema as FormSchema | undefined;
    const data = (sub.data as Record<string, unknown>) ?? {};

    // If the partner belongs to an agency, fetch the agency branding as well
    let agencyName: string | null = null;
    let agencyLogoUrl: string | null = null;
    let agencyPrimaryColor: string | null = null;
    let agencyAccentColor: string | null = null;

    if (partner?.parent_partner_id) {
      const { data: agency } = await supabase
        .from("partners")
        .select("name, logo_url, primary_color, accent_color")
        .eq("id", partner.parent_partner_id)
        .maybeSingle();
      if (agency) {
        agencyName = agency.name;
        agencyLogoUrl = agency.logo_url;
        agencyPrimaryColor = agency.primary_color;
        agencyAccentColor = agency.accent_color;
      }
    }

    // Resolve branding -- partner overrides agency, agency overrides defaults
    const primaryColor = partner?.primary_color || agencyPrimaryColor || "#696cf8";
    const accentColor = partner?.accent_color || agencyAccentColor || "#f97316";
    const logoUrl = partner?.logo_url || agencyLogoUrl || null;
    const clientName = sub.client_name || "Untitled Submission";
    const partnerName = partner?.name || "linqme";
    const brandName = agencyName ? `${partnerName} -- ${agencyName}` : partnerName;

    // Derived colors
    const primaryLight = lighten(primaryColor, 0.92);
    const primaryMedium = lighten(primaryColor, 0.85);
    const accentLight = lighten(accentColor, 0.9);

    // Build HTML for PDF
    let stepsHtml = "";
    if (schema) {
      for (const step of schema.steps) {
        let fieldsHtml = "";
        for (const f of step.fields) {
          if (f.type === "heading" || f.type === "captcha") continue;
          if (f.type === "file" || f.type === "files") {
            fieldsHtml += `
              <tr>
                <td class="label-cell">${escapeHtml(f.label)}</td>
                <td class="value-cell"><em style="color:#999;">See attachments</em></td>
              </tr>`;
            continue;
          }
          const v = data[f.id];
          let display = "\u2014";
          if (v !== undefined && v !== null && v !== "") {
            display = formatFieldValue(v, f as FieldDef);
          }
          fieldsHtml += `
            <tr>
              <td class="label-cell">${escapeHtml(f.label)}</td>
              <td class="value-cell">${escapeHtml(display)}</td>
            </tr>`;
        }
        stepsHtml += `
          <div class="step-section">
            <h2 class="step-title">${escapeHtml(step.title)}</h2>
            <table class="fields-table">${fieldsHtml}</table>
          </div>`;
      }
    }

    const submittedDate = sub.submitted_at
      ? new Date(sub.submitted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : `Draft (started ${new Date(sub.created_at).toLocaleDateString()})`;

    const statusColors: Record<string, string> = {
      submitted: "#3b82f6", in_review: "#f59e0b", complete: "#10b981",
      archived: "#6b7280", draft: "#6b7280",
    };
    const statusColor = statusColors[sub.status as string] ?? primaryColor;

    // Logo HTML -- show partner/agency logo in the header if available
    const logoHtml = logoUrl
      ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(partnerName)}" class="brand-logo" />`
      : `<div class="brand-logo-text" style="background:${primaryColor};">${escapeHtml(partnerName.charAt(0).toUpperCase())}</div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(clientName)} - Submission</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-wrapper {
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Brand banner ──────────────────────── */
    .brand-banner {
      background: linear-gradient(135deg, ${primaryColor}, ${lighten(primaryColor, 0.2)});
      padding: 32px 64px 28px 64px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: contain;
      background: white;
      padding: 4px;
      flex-shrink: 0;
    }
    .brand-logo-text {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: white;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.3);
    }
    .brand-info {
      flex: 1;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.2px;
    }
    .brand-tagline {
      font-size: 11px;
      color: rgba(255,255,255,0.75);
      margin-top: 2px;
    }

    /* ── Content area ──────────────────────── */
    .content {
      padding: 36px 64px 48px 64px;
      flex: 1;
    }

    /* ── Header ─────────────────────────────── */
    .header {
      padding-bottom: 24px;
      margin-bottom: 28px;
      border-bottom: 2px solid ${primaryLight};
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 800;
      color: #111;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 12px;
      color: #666;
    }
    .header .status-badge {
      display: inline-block;
      padding: 5px 16px;
      border-radius: 20px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${statusColor};
      background: ${statusColor}12;
      border: 1px solid ${statusColor}30;
    }
    .header .date {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
    }

    /* ── Meta box ───────────────────────────── */
    .meta-box {
      background: ${primaryLight};
      border-radius: 10px;
      padding: 18px 24px;
      margin-bottom: 36px;
      border: 1px solid ${primaryMedium};
    }
    .meta-box table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
    }
    .meta-box td {
      padding: 5px 0;
    }
    .meta-box .meta-label {
      color: #666;
      width: 140px;
      font-weight: 500;
    }
    .meta-box .meta-value {
      text-align: right;
      color: #444;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 11px;
    }

    /* ── Step sections ──────────────────────── */
    .step-section {
      margin-bottom: 36px;
      page-break-inside: avoid;
    }
    .step-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: ${primaryColor};
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid ${primaryMedium};
      font-weight: 700;
    }

    /* ── Fields table ───────────────────────── */
    .fields-table {
      width: 100%;
      border-collapse: collapse;
    }
    .fields-table tr:nth-child(even) {
      background: ${primaryLight};
    }
    .fields-table tr:last-child .label-cell,
    .fields-table tr:last-child .value-cell {
      border-bottom: none;
    }
    .label-cell {
      padding: 12px 20px 12px 16px;
      font-size: 12px;
      color: #555;
      vertical-align: top;
      width: 35%;
      border-bottom: 1px solid ${primaryMedium};
      font-weight: 600;
    }
    .value-cell {
      padding: 12px 16px 12px 20px;
      font-size: 13px;
      color: #222;
      white-space: pre-wrap;
      border-bottom: 1px solid ${primaryMedium};
      line-height: 1.55;
      word-break: break-word;
    }

    /* ── Footer ─────────────────────────────── */
    .footer {
      padding: 20px 64px;
      border-top: 2px solid ${primaryMedium};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${primaryColor};
      flex-shrink: 0;
    }
    .footer-name {
      font-size: 10px;
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .footer-date {
      font-size: 9px;
      color: #bbb;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <div class="brand-banner">
      ${logoHtml}
      <div class="brand-info">
        <div class="brand-name">${escapeHtml(partnerName)}</div>
        <div class="brand-tagline">Submission Report</div>
      </div>
    </div>

    <div class="content">
      <div class="header">
        <div class="header-row">
          <div>
            <h1>${escapeHtml(clientName)}</h1>
            <p class="subtitle">${escapeHtml(sub.client_email || "\u2014")}</p>
          </div>
          <div style="text-align:right;">
            <div class="status-badge">${(sub.status as string).replace("_", " ")}</div>
            <p class="date">${submittedDate}</p>
          </div>
        </div>
      </div>

      <div class="meta-box">
        <table>
          <tr>
            <td class="meta-label">Submission ID</td>
            <td class="meta-value">${sub.id}</td>
          </tr>
          <tr>
            <td class="meta-label">Partner</td>
            <td class="meta-value" style="font-family:inherit;">${escapeHtml(brandName)}</td>
          </tr>
        </table>
      </div>

      ${stepsHtml}
    </div>

    <div class="footer">
      <div class="footer-brand">
        <div class="footer-dot"></div>
        <div class="footer-name">${escapeHtml(partnerName)}</div>
      </div>
      <div class="footer-date">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>
</body>
</html>`;

    const safeName = clientName.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "-");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safeName}-submission.html"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
