import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/error-tracking";
import { logRequest } from "@/lib/request-logger";

export async function POST(req: NextRequest) {
  const log = logRequest(req);
  try {
    const body = await req.json();
    const { message, digest, stack, path } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    captureError(new Error(message), {
      digest,
      path,
      metadata: { source: "client", stack, userAgent: req.headers.get("user-agent") },
    });

    log.finish(200);
    return NextResponse.json({ ok: true });
  } catch {
    log.finish(500);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
