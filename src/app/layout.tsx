import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import ThemeProvider from "@/components/ThemeProvider";
import type { ThemeMode } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SiteLaunch", template: "%s · SiteLaunch" },
  description: "Client onboarding, launched.",
  applicationName: "SiteLaunch",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b1326",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const savedTheme = (cookieStore.get("theme")?.value ?? "dark") as ThemeMode;
  // Resolve for server-side initial render
  const isDark = savedTheme === "dark" || savedTheme === "auto";

  return (
    <html lang="en" className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.match(/theme=([^;]+)/);var m=t?t[1]:"dark";var d=m==="dark"||(m==="auto"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-background text-on-surface" suppressHydrationWarning>
        <ThemeProvider defaultMode={savedTheme}>
          {children}
        </ThemeProvider>
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-tertiary/5 blur-[100px] rounded-full" />
        </div>
      </body>
    </html>
  );
}
