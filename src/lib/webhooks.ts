import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface WebhookConfig {
  id: string;
  webhook_url: string;
  name: string;
  provider: string;
  field_map: { fieldId: string; key: string }[] | null;
  signing_secret: string | null;
}

/**
 * Fire all enabled webhooks for a given submission.
 * Called fire-and-forget from the submission pipeline.
 */
export async function fireWebhooks(submissionId: string): Promise<void> {
  const admin = createAdminClient();

  // Load the submission with its form relationship
  const { data: sub, error: subErr } = await admin
    .from("submissions")
    .select("id, partner_id, partner_form_id, form_slug, data, client_email, client_name, submitted_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (subErr || !sub) {
    console.error("[webhooks] submission not found:", subErr?.message ?? submissionId);
    return;
  }

  // Get enabled webhooks for this form
  const { data: webhooks, error: whErr } = await admin
    .from("form_webhooks")
    .select("id, webhook_url, name, provider, field_map, signing_secret")
    .eq("partner_form_id", sub.partner_form_id)
    .eq("is_enabled", true);

  if (whErr || !webhooks || webhooks.length === 0) return;

  // Build the base payload
  const rawData = (sub.data ?? {}) as Record<string, unknown>;

  // Fire each webhook concurrently
  await Promise.allSettled(
    webhooks.map((wh) => deliverWebhook(admin, wh as WebhookConfig, sub, rawData)),
  );
}

async function deliverWebhook(
  admin: ReturnType<typeof createAdminClient>,
  wh: WebhookConfig,
  sub: {
    id: string;
    partner_id: string;
    partner_form_id: string;
    form_slug: string | null;
    client_email: string | null;
    client_name: string | null;
    submitted_at: string | null;
  },
  rawData: Record<string, unknown>,
): Promise<void> {
  const start = Date.now();

  // Build payload -- either mapped fields or all fields
  let payload: Record<string, unknown>;
  if (wh.field_map && wh.field_map.length > 0) {
    payload = {};
    for (const mapping of wh.field_map) {
      const key = mapping.key || mapping.fieldId;
      payload[key] = rawData[mapping.fieldId] ?? null;
    }
  } else {
    payload = { ...rawData };
  }

  // Add metadata
  const body = {
    event: "submission.completed",
    submission_id: sub.id,
    form_slug: sub.form_slug,
    client_email: sub.client_email,
    client_name: sub.client_name,
    submitted_at: sub.submitted_at,
    data: payload,
  };

  const bodyStr = JSON.stringify(body);

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "linqme-webhooks/1.0",
  };

  // HMAC signature for custom webhooks
  if (wh.signing_secret) {
    const sig = crypto
      .createHmac("sha256", wh.signing_secret)
      .update(bodyStr)
      .digest("hex");
    headers["X-Linqme-Signature"] = `sha256=${sig}`;
  }

  let status: "success" | "failed" = "failed";
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

    const res = await fetch(wh.webhook_url, {
      method: "POST",
      headers,
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = res.status;
    responseBody = await res.text().catch(() => null);

    if (res.ok) {
      status = "success";
    } else {
      errorMessage = `HTTP ${res.status}: ${responseBody?.slice(0, 200) ?? ""}`;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  const durationMs = Date.now() - start;

  // Log delivery
  await admin
    .from("webhook_deliveries")
    .insert({
      webhook_id: wh.id,
      submission_id: sub.id,
      status,
      status_code: statusCode,
      response_body: responseBody?.slice(0, 1000) ?? null,
      error_message: errorMessage,
      duration_ms: durationMs,
    })
    .then(() => {}, (err) => {
      console.error("[webhooks] failed to log delivery:", err);
    });
}
