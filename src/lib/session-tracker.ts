import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { createHash } from "crypto";

/**
 * Parse a user-agent string into a friendly device name.
 * e.g. "Chrome on macOS", "Safari on iPhone", "Firefox on Windows"
 */
export function parseDeviceName(userAgent: string): string {
  if (!userAgent) return "Unknown device";

  // Detect browser
  let browser = "Unknown browser";
  if (/Edg\//i.test(userAgent)) browser = "Edge";
  else if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) browser = "Opera";
  else if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) browser = "Chrome";
  else if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";
  else if (/Firefox\//i.test(userAgent)) browser = "Firefox";

  // Detect OS
  let os = "Unknown OS";
  if (/iPhone/i.test(userAgent)) os = "iPhone";
  else if (/iPad/i.test(userAgent)) os = "iPad";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/Mac OS X/i.test(userAgent)) os = "macOS";
  else if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Linux/i.test(userAgent)) os = "Linux";
  else if (/CrOS/i.test(userAgent)) os = "ChromeOS";

  return `${browser} on ${os}`;
}

/**
 * Detect device type from user-agent for icon selection.
 */
export function detectDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  if (/iPad/i.test(userAgent)) return "tablet";
  if (/iPhone|Android.*Mobile/i.test(userAgent)) return "mobile";
  if (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) return "tablet";
  return "desktop";
}

/**
 * Generate a stable session fingerprint from userId + userAgent + ip.
 * Used to avoid creating duplicate rows on every page load.
 */
function sessionFingerprint(userId: string, userAgent: string, ip: string): string {
  return createHash("sha256")
    .update(`${userId}:${userAgent}:${ip}`)
    .digest("hex");
}

/**
 * Track or update a user's session entry.
 * Uses a fingerprint to upsert — only creates a new row for truly new device/ip combos.
 */
export async function trackSession(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<string | null> {
  const admin = createAdminClient();
  const ua = userAgent ?? "";
  const addr = ip ?? "unknown";
  const fingerprint = sessionFingerprint(userId, ua, addr);
  const deviceName = parseDeviceName(ua);

  // Check if a session with this fingerprint already exists
  const { data: existing } = await admin
    .from("user_sessions")
    .select("id, last_active_at")
    .eq("user_id", userId)
    .eq("id", fingerprint.slice(0, 36)) // won't match on fingerprint — use device+ip match
    .maybeSingle();

  // Look for an existing session with same device + ip
  const { data: match } = await admin
    .from("user_sessions")
    .select("id, last_active_at")
    .eq("user_id", userId)
    .eq("ip_address", addr)
    .eq("user_agent", ua)
    .maybeSingle();

  if (match) {
    // Only update if last_active_at is older than 5 minutes
    const lastActive = new Date(match.last_active_at).getTime();
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    if (lastActive < fiveMinAgo) {
      await admin
        .from("user_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", match.id);
    }
    return match.id;
  }

  // Check if the user has ANY prior sessions — only alert for truly new devices
  // (not on their very first login)
  const { count: priorCount } = await admin
    .from("user_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Create new session entry
  const { data: newSession } = await admin
    .from("user_sessions")
    .insert({
      user_id: userId,
      ip_address: addr,
      user_agent: ua,
      device_name: deviceName,
      last_active_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // Send new-device login alert if user already had prior sessions
  if ((priorCount ?? 0) > 0) {
    createNotification(
      userId,
      "new_device_login",
      `New sign-in from ${deviceName}`,
      `We noticed a new sign-in to your account from ${deviceName} (IP: ${addr}). If this wasn't you, review your active sessions in Settings > Security.`,
      "/dashboard/settings?tab=security",
    ).catch(() => {});
  }

  return newSession?.id ?? null;
}

/**
 * Get all sessions for a user, ordered by most recent activity.
 */
export async function getUserSessions(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("last_active_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Delete a specific session for a user.
 */
export async function revokeSession(userId: string, sessionId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Delete all sessions except the specified current one.
 */
export async function revokeAllOtherSessions(userId: string, currentSessionId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_sessions")
    .delete()
    .eq("user_id", userId)
    .neq("id", currentSessionId);

  if (error) throw new Error(error.message);
}
