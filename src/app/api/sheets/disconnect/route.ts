import { NextResponse } from "next/server";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const session = await requireSession();
    const account = await getCurrentAccount(session.userId);
    if (!account) return NextResponse.json({ error: "No account" }, { status: 403 });

    const admin = createAdminClient();
    await admin.from("sheets_connections").delete().eq("partner_id", account.id);
    // Also disable all feeds for this partner
    await admin.from("sheets_feeds").update({ is_enabled: false }).eq("partner_id", account.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sheets-disconnect] error:", err);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
