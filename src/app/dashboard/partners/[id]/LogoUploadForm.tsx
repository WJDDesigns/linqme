"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";

interface Props {
  currentLogoUrl: string | null;
  uploadAction: (formData: FormData) => Promise<void>;
}

export default function LogoUploadForm({ currentLogoUrl, uploadAction }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex items-center gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await uploadAction(fd);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          }
        });
      }}
    >
      <div className="relative w-20 h-20 rounded-xl bg-surface-container-high overflow-hidden shrink-0">
        {currentLogoUrl ? (
          <Image src={currentLogoUrl} alt="Logo" fill className="object-contain" sizes="80px" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant/40">No logo</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          required
          className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg disabled:opacity-50 hover:shadow-[0_0_15px_rgba(192,193,255,0.3)] transition-all"
          >
            {pending ? "Uploading..." : "Upload logo"}
          </button>
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
        <p className="text-xs text-on-surface-variant/60">PNG, JPG, SVG, or WebP. Max 5MB.</p>
      </div>
    </form>
  );
}
