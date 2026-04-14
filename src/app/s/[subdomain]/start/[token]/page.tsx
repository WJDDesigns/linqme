import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/host-url";
import type { FormSchema, UploadedFile } from "@/lib/forms";
import SubmissionForm from "./SubmissionForm";
import { saveStepAction, submitSubmissionAction } from "./actions";
import { uploadFileAction, deleteFileAction } from "./files-actions";

interface Props {
  params: Promise<{ subdomain: string; token: string }>;
}

export default async function SubmissionPage({ params }: Props) {
  const { token } = await params;
  // Note: we intentionally do NOT re-validate the URL's subdomain against the
  // submission's partner. The access_token is itself the secret that authorizes
  // access, and Next's internal RSC pre-rendering of server-action redirects
  // can fire this route with a stale "host=localhost" context that would
  // otherwise poison the client cache with a 404.
  const admin = createAdminClient();
  const { data: sub, error } = await admin
    .from("submissions")
    .select(
      `id, status, data, access_token,
       partners ( id, slug, name, custom_domain, logo_url, primary_color ),
       partner_forms ( id, overrides,
         form_templates ( id, schema )
       )`,
    )
    .eq("access_token", token)
    .maybeSingle();

  if (error || !sub) notFound();

  const partner = Array.isArray(sub.partners) ? sub.partners[0] : sub.partners;
  if (!partner) notFound();

  if (sub.status !== "draft") {
    redirect(await absoluteUrl(`/thanks/${token}`));
  }

  const pf = Array.isArray(sub.partner_forms) ? sub.partner_forms[0] : sub.partner_forms;
  const tpl = pf && (Array.isArray(pf.form_templates) ? pf.form_templates[0] : pf.form_templates);
  const schema = tpl?.schema as FormSchema | undefined;
  if (!schema) notFound();

  const primary = partner.primary_color || "#2563eb";

  // Load any files already uploaded, grouped by field_key.
  const { data: existingFiles } = await admin
    .from("submission_files")
    .select("id, filename, mime_type, size_bytes, storage_path, field_key")
    .eq("submission_id", sub.id)
    .order("created_at", { ascending: true });

  const initialFiles: Record<string, UploadedFile[]> = {};
  for (const f of existingFiles ?? []) {
    (initialFiles[f.field_key] ||= []).push({
      id: f.id,
      filename: f.filename,
      mime_type: f.mime_type,
      size_bytes: f.size_bytes,
      storage_path: f.storage_path,
    });
  }

  // Bind token so client can call actions without exposing the token to the closure
  const boundSave = saveStepAction.bind(null, token);
  const boundSubmit = submitSubmissionAction.bind(null, token);
  const boundUpload = uploadFileAction.bind(null, token);
  const boundDelete = deleteFileAction.bind(null, token);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 flex items-center gap-3 border-b border-slate-200 bg-white">
        {partner.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto" />
        ) : (
          <div className="text-base font-semibold text-slate-900">{partner.name}</div>
        )}
      </header>

      <SubmissionForm
        schema={schema}
        initialData={(sub.data as Record<string, unknown>) ?? {}}
        initialFiles={initialFiles}
        primaryColor={primary}
        saveStep={boundSave}
        submit={boundSubmit}
        uploadFile={boundUpload}
        deleteFile={boundDelete}
      />
    </main>
  );
}
