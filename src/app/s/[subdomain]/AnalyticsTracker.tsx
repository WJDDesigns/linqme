"use client";

import { useEffect } from "react";

interface Props {
  partnerId: string;
  path: string;
}

const SESSION_KEY = "sl_seen";

/**
 * Fires a page view event on mount. Uses sessionStorage to deduplicate
 * unique views within the same browser session.
 */
export default function AnalyticsTracker({ partnerId, path }: Props) {
  useEffect(() => {
    try {
      const key = `${partnerId}:${path}`;
      let seen: string[] = [];
      try {
        seen = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
      } catch { /* empty */ }

      const isUnique = !seen.includes(key);

      const payload = JSON.stringify({
        type: "pageview",
        partner_id: partnerId,
        path,
        referrer: document.referrer || null,
        is_unique: isUnique,
      });

      // Use sendBeacon for reliability (fires even on page exit)
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/analytics", { method: "POST", body: payload, keepalive: true });
      }

      if (isUnique) {
        seen.push(key);
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen));
        } catch { /* full storage */ }
      }
    } catch { /* analytics should never break the page */ }
  }, [partnerId, path]);

  return null;
}
