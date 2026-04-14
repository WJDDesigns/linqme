"use client";

import { useTheme, type ThemeMode } from "./ThemeProvider";

const MODES: { value: ThemeMode; icon: string; label: string }[] = [
  { value: "light", icon: "fa-sun", label: "Light" },
  { value: "dark", icon: "fa-moon", label: "Dark" },
  { value: "auto", icon: "fa-circle-half-stroke", label: "Auto" },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="flex bg-surface-container rounded-lg p-0.5">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          title={m.label}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
            mode === m.value
              ? "bg-primary/15 text-primary"
              : "text-on-surface-variant/40 hover:text-on-surface-variant"
          }`}
        >
          <i className={`fa-solid ${m.icon} text-[10px]`} />
          <span className="hidden xl:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
