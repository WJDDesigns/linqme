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
    startTransition(async () => {
      for (const f of selected) {
        try {
          const fd = new FormData();
          fd.append("file", f);
          const uploaded = await upload(field.id, fd);
          setFiles((prev) =>
            multiple ? [...prev, uploaded] : [uploaded],
          );
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
      <label className="block text-sm font-medium text-slate-800 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.hint && <p className="text-xs text-slate-500 mb-2">{field.hint}</p>}

      {files.length > 0 && (
        <ul className="space-y-2 mb-3">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{f.filename}</div>
                <div className="text-xs text-slate-500">
                  {f.mime_type} · {prettySize(f.size_bytes)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(f.id)}
                disabled={pending}
                className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-30"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddMore && (
        <label
          className="flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm text-slate-600 transition"
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
          <span style={{ color: primaryColor }} className="font-medium">
            {pending ? "Uploading…" : multiple ? "+ Add file(s)" : "+ Choose file"}
          </span>
          {!pending && <span className="text-xs text-slate-400">(max 50 MB)</span>}
        </label>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
