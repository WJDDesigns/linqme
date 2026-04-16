import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAuthenticationOptions, verifyAuthentication } from "@/lib/mfa/passkey";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter } from "@/lib/rate-limit";

/**
 * GET: Generate authentication options for passkey MFA challenge
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimiter.check(`passkey-auth:${ip}`, 5, 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const options = await getAuthenticationOptions(session.userId);
    return NextResponse.json(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Verify a passkey authentication response (MFA challenge)
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimiter.check(`passkey-auth:${ip}`, 5, 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { credential, challenge } = body;

    const requestOrigin = request.headers.get("origin") ?? undefined;

    const verification = await verifyAuthentication(
      session.userId,
      credential,
      challenge,
      requestOrigin,
    );

    if (verification.verified) {
      // Mark MFA as verified for this session by setting a flag
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({ mfa_enabled: true })
        .eq("id", session.userId);
    }

    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
