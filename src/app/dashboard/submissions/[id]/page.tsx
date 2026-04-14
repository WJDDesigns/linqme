import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormSchema } from "@/lib/forms";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;
  await requireSession();
  const supabase = await createClient();

  const { data: sub, error } = await supabase
    .from("submissions")
    .select(
      `id, status, data, client_name, client_email, submitted_at, created_at, access_token,
       partners ( id, name, slug, primary_color ),
       partner_forms ( id, form_templates ( schema ) )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !sub) notFound();
  const partner = Array.isArray(sub.partners) ? sub.partners[0] : sub.partners;
  const pf = Array.isArray(sub.partner_forms) ? sub.partner_forms[0] : sub.partner_forms;
  const tpl = pf && (Array.isArray(pf.form_templates) ? pf.form_templates[0] : pf.form_templates);
  const schema = tpl?.schema as FormSchema | undefined;
  const data = (sub.data as Record<string, unknown>) ?? {};

  // Load uploaded files for this submission and build signed download URLs.
  const { data: fileRows } = await supabase
    .from("submission_files")
    .select("id, field_key, filename, mime_type, size_bytes, storage_path, created_at")
    .eq("submission_id", sub.id)
    .order("created_at", { ascending: true });

  type FileRow = NonNullable<typeof fileRows>[number] & { url: string | null };
  const filesByField: Record<string, FileRow[]> = {};
  for (const f of fileRows ?? []) {
    const { data: signed } = await supabase.storage
      .from("submissions")
      .createSignedUrl(f.storage_path, 60 * 60); // 1 hour
    (filesByField[f.field_key] ||= []).push({ ...f, url: signed?.signedUrl ?? null });
  }

  function prettySize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <Link
          href="/dashboard/submissions"
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          ← Submissions
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {sub.client_name || "Untitled submission"}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {sub.client_email || "—"} · {partner?.name ?? "Unknown partner"}
            </p>
          </div>
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {sub.status}
          </span>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 text-sm">
        <Row label="Received">
          {sub.submitted_at
            ? new Date(sub.submitted_at).toLocaleString()
            : `Draft (started ${new Date(sub.created_at).toLocaleDateString()})`}
        </Row>
        <Row label="Submission ID">
          <span className="font-mono text-xs">{sub.id}</span>
        </Row>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Responses</h2>
        </div>
        {schema ? (
          <div className="divide-y divide-slate-100">
            {schema.steps.map((step) => (
              <section key={step.id} className="p-6">
                <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
                  {step.title}
                </h3>
                <dl className="space-y-3">
                  {step.fields.map((f) => {
                    if (f.type === "file" || f.type === "files") {
                      const files = filesByField[f.id] ?? [];
                      return (
                        <div key={f.id} className="grid grid-cols-3 gap-4">
                          <dt className="text-xs text-slate-500">{f.label}</dt>
                          <dd className="col-span-2">
                            {files.length === 0 ? (
                              <span className="text-sm text-slate-400">—</span>
                            ) : (
                              <ul className="space-y-1.5">
                                {files.map((file) => (
                                  <li key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-slate-900 truncate">{file.filename}</div>
                                      <div className="text-xs text-slate-500">
                                        {file.mime_type ?? "file"} · {prettySize(file.size_bytes)}
                                      </div>
                                    </div>
                                    {file.url && (
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0"
                                      >
                                        Download ↓
                                      </a>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </dd>
                        </div>
                      );
                    }
                    const v = data[f.id];
                    const display =
                      v === undefined || v === null || v === ""
                        ? "—"
                        : String(v);
                    return (
                      <div key={f.id} className="grid grid-cols-3 gap-4">
                        <dt className="text-xs text-slate-500">{f.label}</dt>
                        <dd className="col-span-2 text-sm text-slate-900 whitespace-pre-wrap">
                          {display}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">No schema available.</div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="col-span-2 text-slate-900">{children}</div>
    </div>
  );
}
