import { NextRequest } from "next/server";

interface LogEntry {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string | null;
  userAgent: string | null;
}

/**
 * Log an API request to stdout (picked up by Vercel / hosting platform).
 * Returns a `finish` function — call it with the response status when done.
 */
export function logRequest(req: NextRequest) {
  const start = performance.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");
  const method = req.method;
  const path = req.nextUrl.pathname;

  return {
    finish(status: number) {
      const entry: LogEntry = {
        method,
        path,
        status,
        durationMs: Math.round(performance.now() - start),
        ip,
        userAgent,
      };
      console.log(`[api] ${entry.method} ${entry.path} ${entry.status} ${entry.durationMs}ms`, {
        ip: entry.ip,
      });
    },
  };
}
