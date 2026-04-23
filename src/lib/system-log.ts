import { createAdminClient } from "@/lib/supabase/admin";

export type LogLevel = "info" | "warn" | "error";

export type LogCategory =
  | "auth"
  | "billing"
  | "stripe"
  | "forms"
  | "integrations"
  | "invites"
  | "general";

interface LogOptions {
  level?: LogLevel;
  category?: LogCategory;
  partnerId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write a log entry to the system_logs table for admin diagnostics.
 * Fire-and-forget -- never throws or blocks the caller.
 */
export function systemLog(message: string, options: LogOptions = {}) {
  const { level = "info", category = "general", partnerId, userId, metadata } = options;

  // Also log to console for Vercel runtime logs
  const prefix = `[${category}]`;
  if (level === "error") {
    console.error(prefix, message, metadata ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, metadata ?? "");
  } else {
    console.log(prefix, message, metadata ?? "");
  }

  // Fire-and-forget DB insert
  const admin = createAdminClient();
  admin
    .from("system_logs")
    .insert({
      level,
      category,
      message,
      metadata: metadata ?? {},
      partner_id: partnerId ?? null,
      user_id: userId ?? null,
    })
    .then(({ error }) => {
      if (error) {
        console.error("[system-log] Failed to write log:", error.message);
      }
    });
}

/** Shorthand helpers */
export const logInfo = (msg: string, opts?: Omit<LogOptions, "level">) =>
  systemLog(msg, { ...opts, level: "info" });

export const logWarn = (msg: string, opts?: Omit<LogOptions, "level">) =>
  systemLog(msg, { ...opts, level: "warn" });

export const logError = (msg: string, opts?: Omit<LogOptions, "level">) =>
  systemLog(msg, { ...opts, level: "error" });
