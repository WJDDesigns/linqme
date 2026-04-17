"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormSchema } from "@/lib/forms";
import { toggleFormActiveAction } from "./form-actions";
import FormEditor from "./FormEditor";
import FormPreview from "./FormPreview";
import TemplatePicker from "./TemplatePicker";

export default function FormEditorShell({
  initialSchema,
  hasForm,
  publicUrl,
  primaryColor,
  formId,
  formName,
  isActive: initialIsActive,
  settingsSlot,
}: {
  initialSchema: FormSchema | null;
  hasForm: boolean;
  publicUrl: string | null;
  primaryColor: string;
  formId?: string;
  formName?: string;
  isActive?: boolean;
  settingsSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const [showTemplates, setShowTemplates] = useState(!hasForm);
  const [mode, setMode] = useState<"editor" | "preview">("editor");
  const [liveSchema, setLiveSchema] = useState<FormSchema | null>(initialSchema);
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(initialIsActive ?? true);
  const [publishing, startPublish] = useTransition();
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  function handleTemplateDone() {
    setShowTemplates(false);
    router.refresh();
  }

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTogglePublish() {
    if (!formId) return;
    setPublishMsg(null);
    startPublish(async () => {
      const result = await toggleFormActiveAction(formId, !isActive);
      if (result.ok) {
        setIsActive(!isActive);
        router.refresh();
      } else {
        setPublishMsg(result.error ?? "Failed.");
        setTimeout(() => setPublishMsg(null), 3000);
      }
    });
  }

  if (showTemplates) {
    return (
      <TemplatePicker
        mode={hasForm ? "modal" : "chooser"}
        onDone={handleTemplateDone}
      />
    );
  }

  if (!initialSchema) {
    return (
      <TemplatePicker mode="chooser" onDone={handleTemplateDone} />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top toolbar with preview toggle + public link */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-center justify-between gap-3">
        {/* Left: back link + mode toggle */}
        <div className="flex items-center gap-3">
          {formId && (
            <Link href="/dashboard/form" className="text-xs text-on-surface-variant/60 hover:text-primary transition-colors">
              <i className="fa-solid fa-arrow-left text-[10px] mr-1" />
              {formName || "Forms"}
            </Link>
          )}
        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
          <button
            onClick={() => setMode("editor")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              mode === "editor"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant/60 hover:text-on-surface"
            }`}
          >
            <i className="fa-solid fa-pen-ruler text-[10px] mr-1.5" />
            Editor
          </button>
          <button
            onClick={() => {
              setMode("preview");
              setLiveSchema(initialSchema);
            }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              mode === "preview"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant/60 hover:text-on-surface"
            }`}
          >
            <i className="fa-solid fa-eye text-[10px] mr-1.5" />
            Preview
          </button>
        </div>
          {formId && (
            <Link href={`/dashboard/form/${formId}/entries`}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md text-on-surface-variant/60 hover:text-primary hover:bg-primary/5 transition-all">
              <i className="fa-solid fa-table-list text-[10px] mr-1.5" />
              Entries
            </Link>
          )}
        </div>

        {/* Right: status badge + publish button + settings + public link */}
        <div className="flex items-center gap-2">
          {/* Publish status + toggle */}
          {formId && (
            <div className="flex items-center gap-2">
              {publishMsg && (
                <span className="text-[10px] text-error font-medium hidden sm:inline">{publishMsg}</span>
              )}
              <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                isActive
                  ? "text-tertiary bg-tertiary/10 border-tertiary/20"
                  : "text-on-surface-variant/60 bg-surface-container-high border-outline-variant/15"
              }`}>
                <i className={`fa-solid ${isActive ? "fa-circle-check" : "fa-circle-pause"} text-[8px] mr-1`} />
                {isActive ? "Published" : "Draft"}
              </span>
              <button
                onClick={handleTogglePublish}
                disabled={publishing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap disabled:opacity-60 ${
                  isActive
                    ? "text-on-surface-variant border border-outline-variant/20 hover:border-error/30 hover:text-error"
                    : "text-on-primary bg-tertiary hover:shadow-[0_0_12px_rgba(100,220,180,0.3)]"
                }`}
              >
                <i className={`fa-solid ${isActive ? "fa-eye-slash" : "fa-rocket"} text-[10px]`} />
                {publishing ? "..." : isActive ? "Unpublish" : "Publish"}
              </button>
            </div>
          )}
          {settingsSlot}
          {publicUrl && isActive && (
            <>
              <span className="text-xs text-on-surface-variant/60 hidden md:inline truncate max-w-[200px] lg:max-w-xs">
                {publicUrl.replace(/^https?:\/\//, "")}
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-all whitespace-nowrap"
              >
                <i className={`fa-solid ${copied ? "fa-check" : "fa-link"} text-[10px]`} />
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-primary/30 hover:text-primary transition-all whitespace-nowrap"
              >
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                <span className="hidden sm:inline">Open</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {mode === "editor" ? (
          <FormEditor
            initialSchema={initialSchema}
            onOpenTemplates={() => setShowTemplates(true)}
            formId={formId}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <FormPreview schema={initialSchema} primaryColor={primaryColor} />
          </div>
        )}
      </div>
    </div>
  );
}
