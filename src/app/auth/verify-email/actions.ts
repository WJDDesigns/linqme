"use server";

import { resendVerificationEmail } from "@/lib/notifications";

export type ResendResult =
  | { ok: true }
  | { ok: false; error: string };

export async function resendVerificationAction(email: string): Promise<ResendResult> {
  if (!email) {
    return { ok: false, error: "Email address is required." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.linqme.io";
  const redirectTo = `${appUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`;

  try {
    await resendVerificationEmail({ email, redirectTo });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resend verification email.";
    return { ok: false, error: message };
  }
}
