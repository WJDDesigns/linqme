"use client";

import { useEffect } from "react";

interface Props {
  themeMode: string;
}

/**
 * Applies the partner's theme_mode preference to the HTML element
 * for client-facing pages. Overrides the user's personal theme cookie
 * since the partner controls the look of their onboarding portal.
 *
 * themeMode: "dark" | "light" | "auto"
 */
export default function ClientThemeScript({ themeMode }: Props) {
  useEffect(() => {
    const html = document.documentElement;

    function apply() {
      let isDark: boolean;
      if (themeMode === "auto") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = themeMode === "dark";
      }
      html.classList.toggle("dark", isDark);
    }

    apply();

    // Listen for system preference changes when in auto mode
    if (themeMode === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [themeMode]);

  // Inline script to prevent FOUC — runs before React hydrates
  const inlineScript = `(function(){try{var m="${themeMode}";var d=m==="dark"||(m==="auto"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: inlineScript }}
      suppressHydrationWarning
    />
  );
}
