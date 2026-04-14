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

  const primary = partner.primary_color || "#c0c1ff";

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

  const boundSave = saveStepAction.bind(null, token);
  const boundSubmit = submitSubmissionAction.bind(null, token);
  const boundUpload = uploadFileAction.bind(null, token);
  const boundDelete = deleteFileAction.bind(null, token);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {partner.logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${primary}20` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary }}>
              <span className="text-on-primary font-bold">{partner.name.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-on-surface font-headline tracking-tight">{partner.name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: `${primary}99` }}>Powered by SiteLaunch</span>
          </div>
        </div>
      </header>

      <div className="pt-24">
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
      </div>
    </main>
  );
}
