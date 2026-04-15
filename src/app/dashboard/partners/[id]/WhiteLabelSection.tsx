"use client";

import { useTransition, useState } from "react";

interface Partner {
  plan_tier: string;
  hide_branding: boolean;
  custom_footer_text: string | null;
  logo_size: string;
  theme_mode: string;
}

interface Props {
  partner: Partner;
  canEdit: boolean;
  updateAction: (formData: FormData) => Promise<void>;
}

const INPUT_CLS =
  "block w-full px-4 py-3 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none transition-all duration-200";

const LOGO_SIZES = [
  { value: "default", label: "Default", desc: "40px icon in header" },
  { value: "large", label: "Large", desc: "64px logo, more prominent" },
  { value: "full-width", label: "Full Width", desc: "Logo spans header width" },
];

const THEME_MODES = [
  { value: "dark", label: "Dark", icon: "fa-moon" },
  { value: "light", label: "Light", icon: "fa-sun" },
  { value: "auto", label: "Auto", icon: "fa-circle-half-stroke" },
];

export default function WhiteLabelSection({ partner, canEdit, updateAction }: Props) {
  const isPaid = partner.plan_tier !== "free";
  const locked = !isPaid;
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      try {
        await updateAction(formData);
        setMsg("White-label settings saved!");
      } catch {
        setMsg("Failed to save.");
      }
    });
  }

  return (
    <section className="glass-panel rounded-2xl border border-outline-variant/15 p-6 space-y-5 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          <i className="fa-solid fa-wand-magic-sparkles mr-2 text-primary/60" />
          White-Label Branding
        </h2>
        {isPaid ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary bg-tertiary/10 px-2 py-1 rounded-full border border-tertiary/20">
            <i className="fa-solid fa-check text-[8px] mr-1" /> Enabled
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 bg-surface-container-high px-2 py-1 rounded-full border border-outline-variant/15">
            <i className="fa-solid fa-lock text-[8px] mr-1" /> Paid Plan
          </span>
        )}
      </div>

      {locked && (
        <div className="rounded-xl bg-surface-container border border-outline-variant/15 p-4 flex items-start gap-3">
          <i className="fa-solid fa-gem text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-on-surface">Upgrade to remove SiteLaunch branding</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Paid plans and above can hide the SiteLaunch footer, add custom footer text,
              customize the logo size, and choose a light or dark theme for their onboarding portal.
            </p>
            <a
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] transition-all"
            >
              <i className="fa-solid fa-rocket text-[10px]" />
              View plans & upgrade
            </a>
          </div>
        </div>
      )}

      <form action={handleSubmit} className={locked ? "opacity-40 pointer-events-none select-none" : ""}>
        {/* Hide SiteLaunch branding */}
        <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl mb-4">
          <div>
            <span className="text-sm font-medium text-on-surface">Hide SiteLaunch footer</span>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">Remove &ldquo;Powered by SiteLaunch&rdquo; from your onboarding pages</p>
          </div>
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              name="hide_branding"
              value="true"
              defaultChecked={partner.hide_branding}
              disabled={!canEdit || locked}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-surface-container-highest rounded-full peer-checked:bg-primary transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-on-surface-variant rounded-full peer-checked:translate-x-5 peer-checked:bg-on-primary transition-all" />
          </label>
        </div>

        {/* Custom footer text */}
        <div className="mb-4">
          <label className="block">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Custom footer text</span>
            <span className="block text-xs text-on-surface-variant/60 mt-0.5 mb-1.5">
              Replaces the default SiteLaunch footer. e.g. &ldquo;&copy; 2026 Your Company&rdquo;
            </span>
            <input
              name="custom_footer_text"
              defaultValue={partner.custom_footer_text ?? ""}
              disabled={!canEdit || locked}
              className={INPUT_CLS}
              placeholder="&copy; 2026 Your Company Name"
            />
          </label>
        </div>

        {/* Logo size */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block mb-2">Logo display size</span>
          <div className="grid grid-cols-3 gap-2">
            {LOGO_SIZES.map((size) => (
              <label
                key={size.value}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  name="logo_size"
                  value={size.value}
                  defaultChecked={partner.logo_size === size.value}
                  disabled={!canEdit || locked}
                  className="sr-only peer"
                />
                <div className="p-3 rounded-xl border border-outline-variant/15 text-center peer-checked:border-primary/40 peer-checked:bg-primary/5 transition-all">
                  <p className="text-sm font-bold text-on-surface">{size.label}</p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{size.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Client form theme */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest block mb-2">Client form theme</span>
          <div className="grid grid-cols-3 gap-2">
            {THEME_MODES.map((tm) => (
              <label
                key={tm.value}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  name="theme_mode"
                  value={tm.value}
                  defaultChecked={partner.theme_mode === tm.value}
                  disabled={!canEdit || locked}
                  className="sr-only peer"
                />
                <div className="p-3 rounded-xl border border-outline-variant/15 text-center peer-checked:border-primary/40 peer-checked:bg-primary/5 transition-all flex flex-col items-center gap-1">
                  <i className={`fa-solid ${tm.icon} text-lg text-on-surface-variant peer-checked:text-primary`} />
                  <p className="text-sm font-bold text-on-surface">{tm.label}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {canEdit && !locked && (
          <div className="flex items-center justify-end gap-3 pt-2">
            {msg && (
              <span className={`text-xs font-medium ${msg.includes("saved") ? "text-tertiary" : "text-error"}`}>
                {msg}
              </span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] disabled:opacity-50 transition-all"
            >
              {pending ? "Saving..." : "Save white-label settings"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
