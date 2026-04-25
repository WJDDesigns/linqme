"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperadmin, IMPERSONATE_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { systemLog } from "@/lib/system-log";

export async function startImpersonation(partnerId: string) {
  const session = await requireSuperadmin();

  // Verify partner exists
  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("id, name")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) throw new Error("Partner not found");

  // Audit log
  systemLog(`Superadmin started impersonating partner "${partner.name}"`, {
    level: "warn",
    category: "auth",
    userId: session.userId,
    partnerId,
    metadata: { action: "impersonate_start", partnerName: partner.name },
  });

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, partnerId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 4, // 4 hours max
  });

  redirect("/dashboard");
}

export async function stopImpersonation() {
  const session = await requireSuperadmin();

  // Audit log
  systemLog("Superadmin stopped impersonation", {
    level: "info",
    category: "auth",
    userId: session.userId,
    metadata: { action: "impersonate_stop" },
  });

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);

  redirect("/dashboard");
}
