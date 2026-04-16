import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserSessions, revokeAllOtherSessions } from "@/lib/session-tracker";

/**
 * GET /api/sessions — returns all sessions for the current user.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const sessions = await getUserSessions(session.userId);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * POST /api/sessions — revoke all other sessions.
 * Body: { currentSessionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const currentSessionId = body.currentSessionId;

    if (!currentSessionId || typeof currentSessionId !== "string") {
      return NextResponse.json(
        { error: "currentSessionId is required" },
        { status: 400 },
      );
    }

    await revokeAllOtherSessions(session.userId, currentSessionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * DELETE /api/sessions — revoke a specific session.
 * Query param: ?id=<sessionId>
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    const sessionId = request.nextUrl.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session id is required" },
        { status: 400 },
      );
    }

    const { revokeSession } = await import("@/lib/session-tracker");
    await revokeSession(session.userId, sessionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
