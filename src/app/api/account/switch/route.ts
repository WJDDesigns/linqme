import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, CONTEXT_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { partnerId } = body as { partnerId?: string };

  if (!partnerId || typeof partnerId !== "string") {
    return NextResponse.json({ error: "Missing partnerId" }, { status: 400 });
  }

  // Verify the user actually has a membership for this partner
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("partner_members")
    .select("partner_id")
    .eq("user_id", session.userId)
    .eq("partner_id", partnerId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "No membership for this partner" }, { status: 403 });
  }

  // Set the context cookie
  const cookieStore = await cookies();
  cookieStore.set(CONTEXT_COOKIE, partnerId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return NextResponse.json({ ok: true });
}
