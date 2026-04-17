"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LinqMeLogo from "@/components/LinqMeLogo";

/**
 * Top-left header bar for auth pages — linqme wordmark logo.
 * Detects dark/light mode and switches logo variant accordingly.
 */
export default function AuthHeader() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <Link href="/" className="inline-flex items-center gap-2.5 group">
        <LinqMeLogo className="h-8 w-auto" variant={isDark ? "light" : "dark"} />
      </Link>
    </header>
  );
}
