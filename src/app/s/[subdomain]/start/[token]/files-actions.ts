"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UploadedFile } from "@/lib/forms";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB per file

async function loadSubmissionMeta(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("submissions")
    .select("id, status, partner_id")
    .eq("access_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Submission not found");
  if (data.status !== "draft") throw new Error("Submission is locked");
  return data;
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "_");
  return cleaned.slice(0, 180) || "file";
}

export async function uploadFileAction(
  token: string,
  fieldId: string,
  formData: FormData,
): Promise<UploadedFile> {
  const sub = await loadSubmissionMeta(token);
  const file = formData.get("file");
  if (!file || typeof file === "string" || !(file as File).size) {
    throw new Error("No file provided");
  }
  const f = file as File;
  if (f.size > MAX_BYTES) throw new Error("File is too large (50 MB max)");

  const admin = createAdminClient();

  const safe = sanitizeFilename(f.name);
  const path = `${sub.partner_id}/${sub.id}/${fieldId}/${Date.now()}-${safe}`;
  const bytes = Buffer.from(await f.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("submissions")
    .upload(path, bytes, { contentType: f.type || undefined, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: row, error: insErr } = await admin
    .from("submission_files")
    .insert({
      submission_id: sub.id,
      field_key: fieldId,
      storage_path: path,
      filename: f.name,
      mime_type: f.type || null,
      size_bytes: f.size,
    })
    .select("id, storage_path, filename, mime_type, size_bytes")
    .single();
  if (insErr) throw new Error(insErr.message);

  return row as UploadedFile;
}

export async function deleteFileAction(token: string, fileId: string): Promise<void> {
  const sub = await loadSubmissionMeta(token);
  const admin = createAdminClient();

  const { data: row, error: selErr } = await admin
    .from("submission_files")
    .select("id, storage_path, submission_id")
    .eq("id", fileId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (!row) return;
  if (row.submission_id !== sub.id) throw new Error("Not your file");

  await admin.storage.from("submissions").remove([row.storage_path]);
  await admin.from("submission_files").delete().eq("id", fileId);
}
