"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionEntry {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

function maskIp(ip: string | null): string {
  if (!ip || ip === "unknown") return "Unknown";
  // IPv4: show first and last octet
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.xxx.xxx.${parts[3]}`;
  }
  // IPv6 or other: show first and last segment
  const segments = ip.split(":");
  if (segments.length > 2) {
    return `${segments[0]}:***:${segments[segments.length - 1]}`;
  }
  return ip;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function detectDeviceType(ua: string | null): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop";
  if (/iPad/i.test(ua)) return "tablet";
  if (/iPhone|Android.*Mobile/i.test(ua)) return "mobile";
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return "tablet";
  return "desktop";
}

function DeviceIcon({ type }: { type: "mobile" | "tablet" | "desktop" }) {
  const iconClass =
    type === "mobile"
      ? "fa-mobile-screen"
      : type === "tablet"
      ? "fa-tablet-screen-button"
      : "fa-desktop";

  return (
    <div className="w-10 h-10 rounded-xl bg-surface-container-high/40 flex items-center justify-center text-on-surface-variant shrink-0">
      <i className={`fa-solid ${iconClass}`} />
    </div>
  );
}

interface Props {
  currentSessionId: string | null;
}

export default function SessionsSection({ currentSessionId }: Props) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleRevoke(sessionId: string) {
    setRevoking(sessionId);
    setError(null);
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke session");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  }

  async function handleRevokeAll() {
    if (!currentSessionId) return;
    setRevokingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSessionId }),
      });
      if (!res.ok) throw new Error("Failed to revoke sessions");
      setSessions((prev) =>
        prev.filter((s) => s.id === currentSessionId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke sessions",
      );
    } finally {
      setRevokingAll(false);
    }
  }

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

  return (
    <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Active Sessions
        </h2>
        {sessions.length > 1 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
            {sessions.length} device{sessions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-on-surface-variant/50 py-4 text-center">
          <i className="fa-solid fa-spinner fa-spin mr-1.5" /> Loading
          sessions...
        </div>
      ) : error ? (
        <div className="text-sm text-error py-4 text-center">
          <i className="fa-solid fa-circle-exclamation text-[10px] mr-1.5" />
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-on-surface-variant/50 py-4 text-center">
          No active sessions found.
        </p>
      ) : (
        <div>
          {/* Session list */}
          <div className="divide-y divide-outline-variant/[0.05]">
            {sessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              const deviceType = detectDeviceType(s.user_agent);

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <DeviceIcon type={deviceType} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {s.device_name || "Unknown device"}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-on-surface-variant/50">
                        {maskIp(s.ip_address)}
                      </span>
                      <span className="text-on-surface-variant/20">
                        &middot;
                      </span>
                      <span className="text-[11px] text-on-surface-variant/50">
                        {timeAgo(s.last_active_at)}
                      </span>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleRevoke(s.id)}
                      disabled={revoking === s.id}
                      className="text-error text-xs font-semibold hover:underline disabled:opacity-50 shrink-0"
                    >
                      {revoking === s.id ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                      ) : (
                        "Revoke"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sign out all others */}
          {otherSessions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-outline-variant/[0.05]">
              <button
                onClick={handleRevokeAll}
                disabled={revokingAll}
                className="border border-error/20 text-error rounded-xl px-4 py-2 text-sm font-semibold hover:bg-error/5 transition-colors disabled:opacity-50"
              >
                {revokingAll ? (
                  <span className="flex items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                    Signing out...
                  </span>
                ) : (
                  <span>
                    <i className="fa-solid fa-right-from-bracket text-[10px] mr-1.5" />
                    Sign out all other sessions
                  </span>
                )}
              </button>
              <p className="text-[11px] text-on-surface-variant/40 mt-2">
                This will invalidate all sessions except your current one.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
