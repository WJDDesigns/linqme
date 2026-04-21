import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { getSheetsAuthUrl } from "@/lib/sheets/google-sheets";
import { rateLimiter } from "@/lib/rate-limit";

function signState(payload: string): string {
  const secret = process.env.CLOUD_TOKEN_ENCRYPTION_KEY ?? "";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = rateLimiter.check(`sheets-connect:${ip}`, 10, 60);
    if (!success) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": "60" } });
    }

    const session = await requireSession();
    const account = await getCurrentAccount(session.userId);
    if (!account) return NextResponse.json({ error: "No account" }, { status: 403 });

    const nonce = randomBytes(16).toString("hex");
    const statePayload = JSON.stringify({ partnerId: account.id, provider: "google_sheets", nonce });
    const signature = signState(statePayload);
    const state = Buffer.from(JSON.stringify({ payload: statePayload, sig: signature })).toString("base64url");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.linqme.io";
    const redirectUri = `${appUrl}/api/sheets/callback`;
    const authUrl = getSheetsAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("sheets_oauth_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[sheets-connect] error:", err);
    return NextResponse.json({ error: "Failed to initiate connection" }, { status: 500 });
  }
}
