import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/analytics
 * Lightweight endpoint for recording page views and form events.
 * Called from the storefront via sendBeacon or fetch.
 *
 * Body: { type: "pageview" | "form_event", partner_id, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = createAdminClient();

    const country =
      req.headers.get("x-vercel-ip-country") ??
      req.headers.get("cf-ipcountry") ??
      null;

    if (body.type === "pageview") {
      const { partner_id, path, referrer, is_unique } = body;
      if (!partner_id || !path) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      await admin.from("page_views").insert({
        partner_id,
        path,
        referrer: referrer || null,
        user_agent: req.headers.get("user-agent") || null,
        country,
        is_unique: is_unique ?? true,
      });
    } else if (body.type === "form_event") {
      const { partner_id, form_slug, event_type, submission_id, step_index, metadata } = body;
      if (!partner_id || !form_slug || !event_type) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }

      await admin.from("form_events").insert({
        partner_id,
        form_slug,
        event_type,
        submission_id: submission_id || null,
        step_index: step_index ?? null,
        metadata: metadata ?? {},
      });
    } else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
