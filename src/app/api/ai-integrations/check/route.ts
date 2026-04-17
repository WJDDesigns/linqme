import { NextResponse } from "next/server";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await requireSession();
    const account = await getCurrentAccount(session.userId);
    if (!account) return NextResponse.json({ hasAI: false, providers: [] });

    const admin = createAdminClient();
    const { data: integrations } = await admin
      .from("ai_integrations")
      .select("provider")
      .eq("partner_id", account.id);

    const providers = (integrations ?? []).map((i) => i.provider);

    return NextResponse.json({ hasAI: providers.length > 0, providers });
  } catch (err) {
    console.error("[ai-integrations-check] error:", err);
    return NextResponse.json({ hasAI: false, providers: [] });
  }
}
