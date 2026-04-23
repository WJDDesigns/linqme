"use client";

import { useRef, useState, useTransition } from "react";
import type { FieldDef, UploadedFile } from "@/lib/forms";

interface Props {
  field: FieldDef;
  initialFiles: UploadedFile[];
  upload: (fieldId: string, formData: FormData) => Promise<UploadedFile>;
  remove: (fileId: string) => Promise<void>;
  primaryColor: string;
}

function prettySize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileField({ field, initialFiles, upload, remove, primaryColor }: Props) {
  const multiple = field.type === "files";
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setError(null);

    // Client-side size validation for instant feedback
    for (const f of selected) {
      const isVideo = f.type.startsWith("video/");
      const limit = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
      const limitLabel = isVideo ? "100 MB" : "50 MB";
      if (f.size > limit) {
        setError(`"${f.name}" is too large (${limitLabel} max for ${isVideo ? "videos" : "files"}).`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    startTransition(async () => {
      for (const f of selected) {
        try {
          const fd = new FormData();
          fd.append("file", f);
          const uploaded = await upload(field.id, fd);
          setFiles((prev) => multiple ? [...prev, uploaded] : [uploaded]);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          break;
        }
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      try {
        await remove(id);
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const canAddMore = multiple || files.length === 0;

  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5 ml-1">
        {field.label}
        {field.required && <span className="ml-1" style={{ color: primaryColor }}>*</span>}
      </label>
      {field.hint && <p className="text-xs text-on-surface-variant/60 mb-2 ml-1">{field.hint}</p>}

      {files.length > 0 && (
        <ul className="space-y-2 mb-3">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-on-surface truncate">{f.filename}</div>
                <div className="text-xs text-on-surface-variant/60">
                  {f.mime_type} &middot; {prettySize(f.size_bytes)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(f.id)}
                disabled={pending}
                className="text-xs text-on-surface-variant/60 hover:text-error disabled:opacity-30 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddMore && (
        <div className="group relative">
          {/* Nebula glow */}
          <div className="absolute -inset-4 nebula-glow rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <label
            className="relative flex flex-col items-center justify-center gap-3 px-4 py-10 rounded-2xl border-2 border-dashed border-outline-variant/30 hover:border-primary/40 bg-surface-container-lowest/30 backdrop-blur cursor-pointer transition-all duration-300"
            style={pending ? { opacity: 0.6 } : undefined}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={field.accept}
              multiple={multiple}
              disabled={pending}
              onChange={handleSelect}
            />
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i className="fa-solid fa-cloud-arrow-up text-3xl" style={{ color: primaryColor }} />
            </div>
            <p className="text-sm font-semibold text-on-surface font-headline">
              {pending ? "Uploading..." : "Click or drag to upload"}
            </p>
            <p className="text-xs text-on-surface-variant/60">Max 50 MB per file · 100 MB for videos</p>
          </label>
        </div>
      )}

      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  );
}
