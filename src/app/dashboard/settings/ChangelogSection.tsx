"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Auto-versioned changelog entries                                   */
/*  Each entry gets a semantic version. Add newest entries at top.     */
/*  versioning: major = breaking/big launch, minor = feature,          */
/*  patch = fix/tweak                                                  */
/* ------------------------------------------------------------------ */

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: "feature" | "improvement" | "fix" | "breaking";
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.6.0",
    date: "2026-04-19",
    title: "Stripe Connect OAuth and Geocoding Defaults",
    type: "feature",
    changes: [
      "Added Stripe Connect OAuth flow so you can connect your Stripe account with one click instead of pasting API keys",
      "OpenStreetMap is now the default geocoding provider, giving address autocomplete out of the box with zero configuration",
      "Added global default geocoding provider setting in Integrations so you can choose between OpenStreetMap and Google Places workspace-wide",
      "Added per-field provider override in the form editor so individual address fields can use a different provider than the workspace default",
      "Updated submission page to respect workspace-level geocoding provider preference",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-18",
    title: "Insights Dashboard Overhaul",
    type: "feature",
    changes: [
      "Rebuilt the Insights widget system with a slide-out drawer for adding widgets",
      "Added a Widget Gallery with 18 pre-built templates across 4 categories: overview, activity, charts, and tables",
      "Drag-and-drop support for rearranging dashboard widgets with visual drop indicators",
      "Custom widget builder for advanced users who want full control",
      "Improved widget card styling with solid backgrounds for better readability",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-17",
    title: "Geocoding Integrations and Settings Deep Linking",
    type: "feature",
    changes: [
      "Added Google Places and OpenStreetMap geocoding integrations for address autocomplete",
      "Settings page now supports deep linking via URL params (e.g. ?tab=integrations)",
      "Address fields can now use autocomplete powered by Google Places or OpenStreetMap Nominatim",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04-16",
    title: "Field Categories and Industry Filtering",
    type: "feature",
    changes: [
      "Reorganized form fields into logical categories for easier discovery",
      "Added industry tag filtering system so you can find fields relevant to your business type",
      "Added Name field with first/middle/last/suffix sub-fields",
      "Upgraded Email, Phone, Text, and Address fields with better validation and UX",
      "Removed standalone Country/State fields in favor of the unified Address field",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-04-15",
    title: "Payment, Captcha, and Layout Improvements",
    type: "feature",
    changes: [
      "Added payment field type with Stripe integration support",
      "Added captcha/bot protection field supporting reCAPTCHA and Cloudflare Turnstile",
      "Added state-only country selector for US-specific forms",
      "Added column layout support for multi-column form sections",
      "Captcha and Payment integration management in Settings",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-04-13",
    title: "Cloud Storage and AI Integrations",
    type: "feature",
    changes: [
      "Added Google Drive, Dropbox, and OneDrive cloud storage integrations with OAuth",
      "Added AI integrations for OpenAI and Anthropic to power smart form features",
      "File upload fields can now sync to connected cloud storage providers",
      "Workspace branding section with custom colors, logo, and white-label support",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-10",
    title: "Initial Launch",
    type: "feature",
    changes: [
      "Multi-step form builder with drag-and-drop field ordering",
      "Client portal with branded submission experience",
      "Real-time submission tracking and status management",
      "Email notifications via Resend when clients submit",
      "Custom domain support with DNS verification",
      "MFA and session management for account security",
      "Data export for compliance and backup",
    ],
  },
];

const TYPE_STYLES: Record<ChangelogEntry["type"], { label: string; bg: string; text: string; icon: string }> = {
  feature: { label: "New Feature", bg: "bg-primary/10", text: "text-primary", icon: "fa-sparkles" },
  improvement: { label: "Improvement", bg: "bg-tertiary/10", text: "text-tertiary", icon: "fa-arrow-up" },
  fix: { label: "Bug Fix", bg: "bg-warning/10", text: "text-warning", icon: "fa-wrench" },
  breaking: { label: "Breaking Change", bg: "bg-error/10", text: "text-error", icon: "fa-triangle-exclamation" },
};

export default function ChangelogSection() {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set([CHANGELOG[0]?.version ?? ""])
  );

  function toggle(version: string) {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  }

  function expandAll() {
    setExpandedVersions(new Set(CHANGELOG.map((e) => e.version)));
  }

  function collapseAll() {
    setExpandedVersions(new Set());
  }

  return (
    <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold font-headline text-on-surface mb-1">
            Changelog
          </h2>
          <p className="text-sm text-on-surface-variant/60">
            See what has been updated, fixed, and added in each release.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/15 rounded-lg hover:bg-surface-container-high/50 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/15 rounded-lg hover:bg-surface-container-high/50 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-outline-variant/15" />

        <div className="space-y-1">
          {CHANGELOG.map((entry, idx) => {
            const isExpanded = expandedVersions.has(entry.version);
            const style = TYPE_STYLES[entry.type];
            const isLatest = idx === 0;

            return (
              <div key={entry.version} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-[12px] top-[18px] w-[13px] h-[13px] rounded-full border-2 ${
                  isLatest
                    ? "border-primary bg-primary"
                    : "border-outline-variant/30 bg-surface-container"
                }`} />

                <button
                  onClick={() => toggle(entry.version)}
                  className={`w-full text-left rounded-xl p-4 transition-all hover:bg-surface-container-high/30 ${
                    isExpanded ? "bg-surface-container-lowest/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-bold text-on-surface bg-surface-container-high/60 px-2 py-0.5 rounded">
                      v{entry.version}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      <i className={`fa-solid ${style.icon} mr-1 text-[8px]`} />
                      {style.label}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/40 ml-auto">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"} text-[10px] text-on-surface-variant/40`} />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface mt-2">{entry.title}</h3>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-up">
                    <ul className="space-y-2 mt-1">
                      {entry.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant/70">
                          <i className="fa-solid fa-circle text-[4px] mt-[8px] text-primary/40 shrink-0" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
