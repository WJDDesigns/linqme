import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormSchema } from "@/lib/forms";
import FormEditor from "./FormEditor";

export default async function FormEditorPage() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Form editor</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          No workspace is associated with your account yet.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Load the active form + template
  const { data: pf } = await supabase
    .from("partner_forms")
    .select(
      `id, template_id,
       form_templates ( id, schema )`,
    )
    .eq("partner_id", account.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const tpl = pf && (Array.isArray(pf.form_templates) ? pf.form_templates[0] : pf.form_templates);
  const schema: FormSchema = (tpl?.schema as FormSchema) ?? { steps: [] };

  if (!pf) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Form editor</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Customize the onboarding form your clients fill out.
        </p>
        <div className="mt-6 bg-surface-container rounded-2xl border border-outline-variant/15 p-6 text-sm text-on-surface-variant">
          No active form found. Visit your partner settings to create one.
        </div>
      </div>
    );
  }

  return <FormEditor initialSchema={schema} />;
}
