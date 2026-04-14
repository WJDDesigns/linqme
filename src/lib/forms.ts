// Form schema types shared between server and client components.

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "select"
  | "checkbox"
  | "file"
  | "files";

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  accept?: string;
  hint?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
}

export interface StepDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface FormSchema {
  steps: StepDef[];
}

export function mergeSchema(base: FormSchema, overrides: Record<string, unknown>): FormSchema {
  // Phase 2a: overrides are a no-op. Phase 2b will merge per-field label/visibility tweaks.
  void overrides;
  return base;
}

export function validateStepData(
  step: StepDef,
  data: Record<string, unknown>,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const f of step.fields) {
    // File fields are validated separately (upload state lives in submission_files).
    if (f.type === "file" || f.type === "files") continue;
    const v = data[f.id];
    if (f.required) {
      if (v === undefined || v === null || v === "") {
        errors[f.id] = "Required";
        continue;
      }
    }
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "email" && typeof v === "string") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errors[f.id] = "Invalid email";
    }
    if (f.type === "url" && typeof v === "string") {
      try {
        new URL(v);
      } catch {
        errors[f.id] = "Invalid URL";
      }
    }
    if (f.type === "number" && typeof v === "string") {
      if (Number.isNaN(Number(v))) errors[f.id] = "Must be a number";
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}
