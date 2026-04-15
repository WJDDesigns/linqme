"use client";

import { useState, useEffect, useCallback } from "react";

type Mode = "light" | "dark" | "auto";

const COOKIE_NAME = "sf-theme";

function resolveIsDark(mode: Mode): boolean {
  if (mode === "auto") {
    return typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true;
  }
  return mode === "dark";
}

/**
 * Compact light/dark/auto toggle for the client-facing storefront.
 * Works independently from the dashboard ThemeProvider — saves
 * preference to its own cookie so it doesn't conflict.
 */
export default function StorefrontThemeToggle({ partnerDefault }: { partnerDefault: string }) {
  const [mode, setModeState] = useState<Mode>(() => {
    // Will be hydrated properly in useEffect
    return (partnerDefault as Mode) || "dark";
  });

  const apply = useCallback((m: Mode) => {
    const html = document.documentElement;
    const isDark = resolveIsDark(m);
    html.classList.toggle("dark", isDark);
    // Update partner theme attr so ThemeProvider doesn't override
    html.setAttribute("data-partner-theme", isDark ? "dark" : "light");
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0b1326" : "#fbf8ff");
  }, []);

  useEffect(() => {
    // Read saved preference from cookie
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
    const saved = match ? (match[1] as Mode) : null;
    if (saved && ["light", "dark", "auto"].includes(saved)) {
      setModeState(saved);
      apply(saved);
    }
  }, [apply]);

  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply(mode);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode, apply]);

  function setMode(m: Mode) {
    setModeState(m);
    apply(m);
    document.cookie = `${COOKIE_NAME}=${m};path=/;max-age=${365 * 86400};SameSite=Lax`;
  }

  const modes: { value: Mode; icon: string; label: string }[] = [
    { value: "light", icon: "fa-sun", label: "Light" },
    { value: "dark", icon: "fa-moon", label: "Dark" },
    { value: "auto", icon: "fa-circle-half-stroke", label: "Auto" },
  ];

  return (
    <div className="flex bg-surface-container/60 backdrop-blur-md rounded-lg p-0.5 border border-outline-variant/[0.06]">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          title={m.label}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-all ${
            mode === m.value
              ? "bg-primary/15 text-primary"
              : "text-on-surface-variant/40 hover:text-on-surface-variant"
          }`}
        >
          <i className={`fa-solid ${m.icon} text-[10px]`} />
        </button>
      ))}
    </div>
  );
}
