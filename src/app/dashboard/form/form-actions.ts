"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFormsLimitForTier } from "@/lib/plans";
import type { FormSchema } from "@/lib/forms";

interface ActionResult {
  ok: boolean;
  error?: string;
  formId?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "form";
}

/**
 * Create a new form for the current account.
 */
export async function createFormAction(name: string): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  if (!name.trim()) return { ok: false, error: "Form name is required." };

  const admin = createAdminClient();

  // Check form limit
  const { data: existingForms } = await admin
    .from("partner_forms")
    .select("id")
    .eq("partner_id", account.id);

  const currentCount = existingForms?.length ?? 0;
  const limit = getFormsLimitForTier(account.planTier);
  if (limit !== null && currentCount >= limit) {
    return { ok: false, error: `You've reached your plan limit of ${limit} form${limit !== 1 ? "s" : ""}. Upgrade to create more.` };
  }

  // Generate unique slug
  let slug = slugify(name);
  const { data: existing } = await admin
    .from("partner_forms")
    .select("slug")
    .eq("partner_id", account.id)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const blankSchema: FormSchema = {
    steps: [
      { id: "step_1", title: "Step 1", description: "", fields: [] },
    ],
  };

  // Create the template
  const { data: tpl, error: tplErr } = await admin
    .from("form_templates")
    .insert({
      slug: `${account.id.slice(0, 8)}-${slug}-${Date.now()}`,
      name: name.trim(),
      version: 1,
      schema: blankSchema,
      owner_partner_id: account.id,
    })
    .select("id")
    .single();

  if (tplErr || !tpl) return { ok: false, error: tplErr?.message ?? "Failed to create form template." };

  // Determine if this is the first form (make it default)
  const isFirst = currentCount === 0;

  // Create the partner_form link
  const { data: pf, error: pfErr } = await admin
    .from("partner_forms")
    .insert({
      partner_id: account.id,
      template_id: tpl.id,
      is_active: true,
      name: name.trim(),
      slug,
      is_default: isFirst,
    })
    .select("id")
    .single();

  if (pfErr || !pf) return { ok: false, error: pfErr?.message ?? "Failed to create form." };

  revalidatePath("/dashboard/form");
  return { ok: true, formId: pf.id };
}

/**
 * Delete a form.
 */
export async function deleteFormAction(formId: string): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  const admin = createAdminClient();

  // Verify ownership
  const { data: form } = await admin
    .from("partner_forms")
    .select("id, is_default, template_id")
    .eq("id", formId)
    .eq("partner_id", account.id)
    .maybeSingle();

  if (!form) return { ok: false, error: "Form not found." };
  if (form.is_default) return { ok: false, error: "Cannot delete the default form. Set another form as default first." };

  // Delete the partner_form (cascade will handle form_partner_assignments)
  const { error } = await admin
    .from("partner_forms")
    .delete()
    .eq("id", formId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/form");
  return { ok: true };
}

/**
 * Set a form as the default.
 */
export async function setDefaultFormAction(formId: string): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  const admin = createAdminClient();

  // Verify ownership
  const { data: form } = await admin
    .from("partner_forms")
    .select("id")
    .eq("id", formId)
    .eq("partner_id", account.id)
    .maybeSingle();

  if (!form) return { ok: false, error: "Form not found." };

  // Unset all defaults for this partner
  await admin
    .from("partner_forms")
    .update({ is_default: false })
    .eq("partner_id", account.id);

  // Set the new default
  const { error } = await admin
    .from("partner_forms")
    .update({ is_default: true })
    .eq("id", formId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/form");
  return { ok: true };
}

/**
 * Rename a form.
 */
export async function renameFormAction(formId: string, name: string): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  if (!name.trim()) return { ok: false, error: "Form name is required." };

  const admin = createAdminClient();

  const { error } = await admin
    .from("partner_forms")
    .update({ name: name.trim() })
    .eq("id", formId)
    .eq("partner_id", account.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/form");
  return { ok: true };
}

/**
 * Toggle a form's published (is_active) state.
 */
export async function toggleFormActiveAction(formId: string, isActive: boolean): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  const admin = createAdminClient();

  // Verify ownership
  const { data: form } = await admin
    .from("partner_forms")
    .select("id, is_default")
    .eq("id", formId)
    .eq("partner_id", account.id)
    .maybeSingle();

  if (!form) return { ok: false, error: "Form not found." };

  // Don't allow unpublishing the default form
  if (form.is_default && !isActive) {
    return { ok: false, error: "Cannot unpublish the default form. Set another form as default first." };
  }

  const { error } = await admin
    .from("partner_forms")
    .update({ is_active: isActive })
    .eq("id", formId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/form");
  revalidatePath(`/dashboard/form/${formId}`);
  return { ok: true };
}

/**
 * Duplicate a form.
 */
export async function duplicateFormAction(formId: string): Promise<ActionResult> {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  if (!account) return { ok: false, error: "No account found." };

  const admin = createAdminClient();

  // Check form limit
  const { data: existingForms } = await admin
    .from("partner_forms")
    .select("id")
    .eq("partner_id", account.id);

  const currentCount = existingForms?.length ?? 0;
  const limit = getFormsLimitForTier(account.planTier);
  if (limit !== null && currentCount >= limit) {
    return { ok: false, error: `You've reached your plan limit of ${limit} form${limit !== 1 ? "s" : ""}. Upgrade to create more.` };
  }

  // Get the source form + template
  const { data: source } = await admin
    .from("partner_forms")
    .select("name, slug, template_id, form_templates(schema)")
    .eq("id", formId)
    .eq("partner_id", account.id)
    .maybeSingle();

  if (!source) return { ok: false, error: "Form not found." };

  const tpl = Array.isArray(source.form_templates) ? source.form_templates[0] : source.form_templates;
  const newName = `${source.name} (copy)`;
  const newSlug = `${source.slug}-copy-${Date.now().toString(36).slice(-4)}`;

  // Create new template with copied schema
  const { data: newTpl, error: tplErr } = await admin
    .from("form_templates")
    .insert({
      slug: `${account.id.slice(0, 8)}-${newSlug}-${Date.now()}`,
      name: newName,
      version: 1,
      schema: tpl?.schema ?? { steps: [] },
      owner_partner_id: account.id,
    })
    .select("id")
    .single();

  if (tplErr || !newTpl) return { ok: false, error: tplErr?.message ?? "Failed." };

  const { data: pf, error: pfErr } = await admin
    .from("partner_forms")
    .insert({
      partner_id: account.id,
      template_id: newTpl.id,
      is_active: true,
      name: newName,
      slug: newSlug,
      is_default: false,
    })
    .select("id")
    .single();

  if (pfErr || !pf) return { ok: false, error: pfErr?.message ?? "Failed." };

  revalidatePath("/dashboard/form");
  return { ok: true, formId: pf.id };
}
