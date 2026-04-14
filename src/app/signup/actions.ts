"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/notifications";

export type SignupResult =
  | { ok: true; next: "/dashboard" | "/login?signup=ok" }
  | { ok: false; error: string };

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("company_name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "");
  const slug = sanitizeSlug(slugRaw || companyName);
  const planType = String(formData.get("plan_type") ?? "agency");

  if (!email || !password || !companyName || !slug) {
    return { ok: false, error: "All fields are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!["agency", "agency_plus_partners"].includes(planType)) {
    return { ok: false, error: "Invalid plan type." };
  }

  const admin = createAdminClient();

  // 1. Make sure slug is free.
  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: `That workspace URL (${slug}) is already taken. Please pick another.`,
    };
  }

  // 2. Create the auth user — auto-confirm so they can sign in immediately.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: companyName },
  });
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Failed to create account." };
  }
  const userId = created.user.id;

  // 3. Bootstrap the top-level partner + membership.
  const { error: bootErr } = await admin.rpc("bootstrap_account", {
    p_owner_id: userId,
    p_company_name: companyName,
    p_slug: slug,
    p_plan_type: planType,
  });
  if (bootErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: bootErr.message };
  }

  // 4. Sign them in so they land on the dashboard with a live session.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });

  // 5. Send welcome email (non-blocking).
  try {
    await sendWelcomeEmail({
      to: email,
      companyName,
      slug,
      planType: planType as "agency" | "agency_plus_partners",
    });
  } catch (err) {
    console.error("[signup] welcome email failed:", err);
  }

  if (signInErr) {
    return { ok: true, next: "/login?signup=ok" };
  }

  return { ok: true, next: "/dashboard" };
}
