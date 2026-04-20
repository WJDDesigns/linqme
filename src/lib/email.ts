/**
 * Thin Resend wrapper.
 *
 * - In production, set RESEND_API_KEY + RESEND_FROM.
 * - In dev without a key, this no-ops and logs the payload so the app
 *   still runs end-to-end without a live provider.
 */
import { Resend } from "resend";

export interface SendMailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendMailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

let resendSingleton: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

function defaultFrom(): string {
  return process.env.RESEND_FROM ?? "linqme <noreply@send.linqme.io>";
}

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  const client = getResend();

  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping. Would send to=${JSON.stringify(args.to)} subject="${args.subject}"`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: defaultFrom(),
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send failed";
    console.error("[email] send error:", msg);
    return { ok: false, error: msg };
  }
}
