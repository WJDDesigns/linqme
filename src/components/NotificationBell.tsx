"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  submission: "fa-inbox",
  team_invite: "fa-user-plus",
  team_invite_accepted: "fa-user-check",
  account_created: "fa-address-card",
  form_published: "fa-rocket",
  form_unpublished: "fa-eye-slash",
  entry_status: "fa-arrows-rotate",
  passkey_added: "fa-key",
  system: "fa-circle-info",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      /* network error — keep stale data */
    }
  }, []);

  // Fetch on mount + every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 20);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notification.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      } catch {
        /* ignore */
      }
    }
    // Navigate if link provided
    if (notification.link) {
      setOpen(false);
      window.location.href = notification.link;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-on-surface-variant hover:text-on-surface transition-colors duration-200"
        aria-label="Notifications"
      >
        <i className="fa-solid fa-bell text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] overflow-hidden bg-surface-container border border-outline-variant/10 rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/[0.05]">
            <h3 className="text-sm font-bold text-on-surface">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {recent.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <i className="fa-regular fa-bell-slash text-2xl text-on-surface-variant/30 mb-2 block" />
                <p className="text-sm text-on-surface-variant/50">
                  No notifications yet
                </p>
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left px-4 py-3 hover:bg-primary/[0.03] border-b border-outline-variant/[0.05] flex items-start gap-3 transition-colors duration-150"
                >
                  {/* Unread dot */}
                  <div className="pt-1.5 shrink-0 w-2">
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className="pt-0.5 shrink-0">
                    <i
                      className={`fa-solid ${TYPE_ICONS[n.type] ?? TYPE_ICONS.system} text-sm text-on-surface-variant/50`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug truncate ${!n.read ? "font-semibold text-on-surface" : "text-on-surface/80"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-on-surface-variant/60 truncate mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-on-surface-variant/50 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
