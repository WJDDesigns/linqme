import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = rateLimiter.check(`login:${ip}`, 5, 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Check MFA status
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aal = aalData?.currentLevel;
  const factors = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactors =
    (factors.data?.totp ?? []).some((f) => f.status === "verified") ||
    (factors.data?.phone ?? []).some((f) => f.status === "verified");

  const needsMfa = hasVerifiedFactors && aal !== "aal2";

  return NextResponse.json({ ok: true, needsMfa });
}
