"use client";

import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) {
      // Small delay so it slides in after page load
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    setCookie("cookie_consent", "accepted", 365);
    setVisible(false);
  }

  function decline() {
    setCookie("cookie_consent", "declined", 365);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      role="banner"
      aria-label="Cookie consent"
    >
      <div className="bg-surface-container border-t border-outline-variant/10 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-on-surface-variant text-sm text-center sm:text-left">
            We use cookies for authentication and analytics.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={decline}
              className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
