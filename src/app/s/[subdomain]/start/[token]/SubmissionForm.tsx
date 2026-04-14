"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import type { FormSchema, FieldDef, UploadedFile } from "@/lib/forms";
import FileField from "./FileField";

interface Props {
  schema: FormSchema;
  initialData: Record<string, unknown>;
  initialFiles: Record<string, UploadedFile[]>;
  primaryColor: string;
  saveStep: (
    stepId: string,
    formData: FormData,
  ) => Promise<{ errors?: Record<string, string>; nextStepId?: string; done?: boolean }>;
  submit: () => Promise<void>;
  uploadFile: (fieldId: string, formData: FormData) => Promise<UploadedFile>;
  deleteFile: (fileId: string) => Promise<void>;
}

/* ── animation styles ──────────────────────────────────────── */
const STYLE_ID = "sl-celestial-styles";
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sl-fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes sl-fade-out { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-30px); } }
    @keyframes sl-fade-in  { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
    @keyframes sl-check    { 0%{ transform:scale(0); } 60%{ transform:scale(1.2); } 100%{ transform:scale(1); } }
    .sl-fade-up   { animation: sl-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both; }
    .sl-fade-out  { animation: sl-fade-out 0.3s ease-in both; }
    .sl-fade-in   { animation: sl-fade-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }
    .sl-check     { animation: sl-check 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    .sl-d1 { animation-delay:0.05s; } .sl-d2 { animation-delay:0.1s; }
    .sl-d3 { animation-delay:0.15s; } .sl-d4 { animation-delay:0.2s; } .sl-d5 { animation-delay:0.25s; }
  `;
  document.head.appendChild(style);
}

const GREETINGS = [
  "Great, let\u2019s keep going!",
  "You\u2019re doing great \u2014 next up:",
  "Almost there, just a few more things.",
  "Nice! Here\u2019s what\u2019s next.",
  "Perfect, moving right along.",
];

const INPUT_CLS =
  "block w-full px-4 py-3 text-base bg-[#060e20] border-0 rounded-xl text-[#dae2fd] placeholder:text-[#c7c6cb]/40 focus:ring-1 outline-none transition-all duration-200";

export default function SubmissionForm({
  schema, initialData, initialFiles, primaryColor,
  saveStep, submit, uploadFile, deleteFile,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [transitioning, setTransitioning] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { ensureStyles(); }, []);

  const step = schema.steps[stepIdx];
  const isLast = stepIdx === schema.steps.length - 1;
  const progress = ((stepIdx + 1) / schema.steps.length) * 100;

  useEffect(() => {
    if (transitioning) return;
    const timer = setTimeout(() => {
      containerRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([type=checkbox]), textarea, select"
      )?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, [stepIdx, transitioning]);

  function updateField(id: string, v: unknown) {
    setData((prev) => ({ ...prev, [id]: v }));
    if (errors[id]) setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  const animateTransition = useCallback((cb: () => void) => {
    setTransitioning(true);
    setTimeout(() => { cb(); setTimeout(() => setTransitioning(false), 50); }, 300);
  }, []);

  function handleNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveStep(step.id, fd);
      if (res.errors) { setErrors(res.errors); return; }
      setErrors({});
      if (res.done) {
        startSubmit(async () => { await submit(); setShowDone(true); });
      } else if (res.nextStepId) {
        const nextIdx = schema.steps.findIndex((s) => s.id === res.nextStepId);
        if (nextIdx >= 0) animateTransition(() => setStepIdx(nextIdx));
      }
    });
  }

  /* Done screen */
  if (showDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-6 sl-fade-up">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center sl-check" style={{ backgroundColor: primaryColor + "18" }}>
            <svg className="w-10 h-10" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">All done!</h1>
          <p className="text-on-surface-variant text-lg">Thanks for submitting everything. We&apos;ll take it from here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" ref={containerRef}>
      {/* Progress bar */}
      <div className="sticky top-[76px] z-10 bg-background/80 backdrop-blur-sm">
        <div className="h-1 w-full bg-surface-container-highest">
          <div
            className="h-full transition-all duration-700 ease-out rounded-r-full"
            style={{ width: `${progress}%`, backgroundColor: primaryColor, boxShadow: `0 0 15px ${primaryColor}66` }}
          />
        </div>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: primaryColor }}>
              Step {stepIdx + 1} of {schema.steps.length}
            </span>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">{step.title}</p>
          </div>
          <span className="text-2xl font-headline font-bold text-on-surface">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-8 md:py-14">
        <div className={`w-full max-w-4xl ${transitioning ? "sl-fade-out" : "sl-fade-in"}`}>
          {/* Header */}
          <div className="mb-10">
            {stepIdx > 0 && (
              <p className="text-sm font-medium mb-2 sl-fade-up" style={{ color: primaryColor }}>
                {GREETINGS[stepIdx % GREETINGS.length]}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface sl-fade-up sl-d1 max-w-2xl leading-tight">
              {step.title}
            </h1>
            {step.description && (
              <p className="text-on-surface-variant mt-3 text-lg leading-relaxed sl-fade-up sl-d2 max-w-xl">
                {step.description}
              </p>
            )}
          </div>

          {/* Fields */}
          <form onSubmit={handleNext} className="space-y-6">
            {step.fields.map((f, i) =>
              f.type === "file" || f.type === "files" ? (
                <div key={f.id} className={`sl-fade-up sl-d${Math.min(i + 2, 5)}`}>
                  <FileField field={f} initialFiles={initialFiles[f.id] ?? []} upload={uploadFile} remove={deleteFile} primaryColor={primaryColor} />
                </div>
              ) : (
                <div key={f.id} className={`sl-fade-up sl-d${Math.min(i + 2, 5)}`}>
                  <CelestialField field={f} value={data[f.id]} error={errors[f.id]} onChange={(v) => updateField(f.id, v)} primaryColor={primaryColor} />
                </div>
              ),
            )}

            {/* Nav */}
            <div className="flex items-center justify-between pt-8 sl-fade-up sl-d5">
              <button
                type="button"
                onClick={() => animateTransition(() => setStepIdx((i) => Math.max(0, i - 1)))}
                disabled={stepIdx === 0 || pending || submitting || transitioning}
                className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface disabled:opacity-0 transition-all text-sm uppercase tracking-widest font-label"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                type="submit"
                disabled={pending || submitting || transitioning}
                className="group px-10 py-4 font-headline font-bold rounded-xl shadow-[0_10px_30px_rgba(192,193,255,0.2)] hover:shadow-[0_15px_40px_rgba(192,193,255,0.35)] hover:-translate-y-1 transition-all flex items-center gap-3 text-on-primary disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <><Spinner /> Submitting...</>
                ) : pending ? (
                  <><Spinner /> Saving...</>
                ) : isLast ? (
                  <>Submit <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></>
                ) : (
                  <>Next Step <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CelestialField({
  field, value, error, onChange, primaryColor,
}: {
  field: FieldDef; value: unknown; error?: string; onChange: (v: unknown) => void; primaryColor: string;
}) {
  const str = (value as string) ?? "";
  const focusRing = { "--tw-ring-color": primaryColor + "66" } as React.CSSProperties;
  const errBorder = error ? "#ffb4ab" : undefined;

  /* Heading fields are display-only — no input */
  if (field.type === "heading") {
    return (
      <div className="py-4 border-b border-[#46464b]/20">
        <h3 className="text-lg font-bold text-[#dae2fd] font-headline">{field.label}</h3>
        {field.content && <p className="text-sm text-[#c7c6cb] mt-1 leading-relaxed">{field.content}</p>}
        {field.hint && <p className="text-xs text-[#c7c6cb]/60 mt-1">{field.hint}</p>}
      </div>
    );
  }

  /* Multi-option checkbox (when field has options array) */
  const isMultiCheckbox = field.type === "checkbox" && field.options && field.options.length > 0;
  /* Parse multi-checkbox value as array */
  const checkedValues: string[] = isMultiCheckbox
    ? (Array.isArray(value) ? value as string[] : typeof value === "string" && value ? value.split("||") : [])
    : [];

  return (
    <div className="group">
      <label htmlFor={field.id} className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1">
        {field.label}
        {field.required && <span className="ml-1" style={{ color: primaryColor }}>*</span>}
      </label>
      {field.hint && <p className="text-xs text-[#c7c6cb]/60 mb-2 ml-1">{field.hint}</p>}

      {field.type === "textarea" ? (
        <textarea id={field.id} name={field.id} required={field.required} placeholder={field.placeholder} rows={field.rows ?? 3} value={str} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} style={{ ...focusRing, borderColor: errBorder }} />

      ) : field.type === "select" ? (
        <select id={field.id} name={field.id} required={field.required} value={str} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} style={focusRing}>
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>

      ) : field.type === "radio" ? (
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer py-3 px-4 rounded-xl border-2 transition-all duration-200" style={str === opt ? { borderColor: primaryColor, backgroundColor: primaryColor + "08" } : { borderColor: "#46464b26" }}>
              <input type="radio" name={field.id} value={opt} checked={str === opt} onChange={() => onChange(opt)} className="h-4 w-4" style={{ accentColor: primaryColor }} />
              <span className="text-sm text-[#dae2fd]">{opt}</span>
            </label>
          ))}
        </div>

      ) : isMultiCheckbox ? (
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => {
            const isChecked = checkedValues.includes(opt);
            const atMax = field.maxSelections && field.maxSelections > 0 && checkedValues.length >= field.maxSelections && !isChecked;
            return (
              <label key={opt} className={`flex items-center gap-3 cursor-pointer py-3 px-4 rounded-xl border-2 transition-all duration-200 ${atMax ? "opacity-40 cursor-not-allowed" : ""}`} style={isChecked ? { borderColor: primaryColor, backgroundColor: primaryColor + "08" } : { borderColor: "#46464b26" }}>
                <input type="checkbox" value={opt} checked={isChecked} disabled={!!atMax} onChange={() => {
                  const next = isChecked ? checkedValues.filter((v) => v !== opt) : [...checkedValues, opt];
                  onChange(next.join("||"));
                }} className="h-4 w-4 rounded" style={{ accentColor: primaryColor }} />
                <span className="text-sm text-[#dae2fd]">{opt}</span>
              </label>
            );
          })}
          {field.maxSelections && field.maxSelections > 0 && (
            <p className="text-xs text-[#c7c6cb]/60 ml-1">Select up to {field.maxSelections}</p>
          )}
        </div>

      ) : field.type === "checkbox" ? (
        <label htmlFor={field.id} className="flex items-center gap-3 cursor-pointer py-3 px-4 rounded-xl border-2 transition-all duration-200" style={value ? { borderColor: primaryColor, backgroundColor: primaryColor + "08" } : { borderColor: "#46464b26" }}>
          <input id={field.id} name={field.id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? "yes" : "")} className="h-5 w-5 rounded" style={{ accentColor: primaryColor }} />
          <span className="text-sm text-[#dae2fd]">{field.placeholder || "Yes"}</span>
        </label>

      ) : field.type === "date" ? (
        <input id={field.id} name={field.id} required={field.required} type="date" value={str} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} style={{ ...focusRing, borderColor: errBorder, colorScheme: "dark" }} />

      ) : field.type === "color" ? (
        <div className="flex items-center gap-3">
          <input type="color" value={str || "#c0c1ff"} onChange={(e) => onChange(e.target.value)} className="w-12 h-12 rounded-xl border-0 cursor-pointer bg-transparent" />
          <input id={field.id} name={field.id} required={field.required} placeholder={field.placeholder || "#c0c1ff"} value={str} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLS} flex-1`} style={{ ...focusRing, borderColor: errBorder }} />
        </div>

      ) : field.type === "address" ? (
        <textarea id={field.id} name={field.id} required={field.required} placeholder={field.placeholder || "Street address, City, State, ZIP"} rows={3} value={str} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} style={{ ...focusRing, borderColor: errBorder }} />

      ) : (
        <input
          id={field.id} name={field.id} required={field.required} placeholder={field.placeholder}
          type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "url" ? "url" : field.type === "number" ? "number" : "text"}
          value={str} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS}
          style={{ ...focusRing, borderColor: errBorder }}
        />
      )}

      {error && (
        <p className="text-sm text-error mt-1.5 sl-fade-up flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
