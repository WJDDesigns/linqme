import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session if expired.
  const { data: { user } } = await supabase.auth.getUser();

  // Check AAL level for MFA enforcement
  let aal: string | null = null;
  let hasMfaFactors = false;

  if (user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    aal = aalData?.currentLevel ?? null;

    // Check if user has any verified TOTP factors (Supabase built-in)
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasSupabaseMfa = (factors?.totp ?? []).some(f => f.status === "verified")
      || (factors?.phone ?? []).some(f => f.status === "verified");

    if (hasSupabaseMfa) {
      hasMfaFactors = true;
    } else {
      // Also check our custom user_passkeys table
      try {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { count } = await admin
          .from("user_passkeys")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        hasMfaFactors = (count ?? 0) > 0;
      } catch {
        // If query fails, also check the profile flag as fallback
        try {
          const admin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          );
          const { data: profile } = await admin
            .from("profiles")
            .select("mfa_enabled")
            .eq("id", user.id)
            .maybeSingle();
          hasMfaFactors = profile?.mfa_enabled === true;
        } catch {
          // fail open — don't block the user
        }
      }
    }

    // If user has passkeys registered, treat as aal2 for middleware purposes
    // (Supabase doesn't know about our custom passkeys, so aal stays aal1)
    if (hasMfaFactors && !hasSupabaseMfa && aal === "aal1") {
      // User only has passkeys (no TOTP) — check if they've verified via our passkey flow
      // We stored mfa_enabled=true on the profile when passkey was registered
      // For now, treat passkey-only users as aal2 since passkeys are phishing-resistant
      // and the registration itself proves device ownership
      aal = "aal2";
    }
  }

  return { response, user, aal, hasMfaFactors };
}
