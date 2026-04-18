"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getCurrentAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

type SubmissionStatus = "draft" | "submitted" | "in_review" | "complete" | "archived";

/**
 * Verify the current user owns the given submission(s).
 * Superadmins can access all submissions.
 */
async function authorizeSubmissions(submissionIds: string[]): Promise<void> {
  const session = await requireSession();
  if (session.role === "superadmin") return;

  const account = await getCurrentAccount(session.userId);
  if (!account) throw new Error("No account found.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("submissions")
    .select("id, partner_id")
    .in("id", submissionIds);

  if (error) throw new Error(error.message);
  if (!data || data.length !== submissionIds.length) {
    throw new Error("One or more submissions not found.");
  }

  for (const sub of data) {
    if (sub.partner_id !== account.id) {
      throw new Error("Not authorized to modify this submission.");
    }
  }
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  complete: "Complete",
  archived: "Archived",
};

export async function updateSubmissionStatusAction(submissionId: string, status: SubmissionStatus) {
  await authorizeSubmissions([submissionId]);
  const admin = createAdminClient();
  const { error } = await admin
    .from("submissions")
    .update({ status })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  // Send notification to partner team members
  const { data: sub } = await admin
    .from("submissions")
    .select("client_name, partner_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (sub) {
    const clientName = sub.client_name || "A client";
    const { data: members } = await admin
      .from("partner_members")
      .select("user_id")
      .eq("partner_id", sub.partner_id);

    if (members) {
      for (const member of members) {
        await createNotification(
          member.user_id,
          "entry_status",
          `Entry marked ${STATUS_LABELS[status]}`,
          `${clientName}'s submission was updated to ${STATUS_LABELS[status]}.`,
          `/dashboard/submissions/${submissionId}`,
        );
      }
    }
  }

  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/entries");
  revalidatePath(`/dashboard/submissions/${submissionId}`);
}

export async function deleteSubmissionAction(submissionId: string) {
  await authorizeSubmissions([submissionId]);
  const admin = createAdminClient();

  // Delete files from storage first
  const { data: files } = await admin
    .from("submission_files")
    .select("storage_path")
    .eq("submission_id", submissionId);

  if (files && files.length > 0) {
    await admin.storage
      .from("submissions")
      .remove(files.map((f) => f.storage_path));
  }

  const { error } = await admin
    .from("submissions")
    .delete()
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/entries");
}

export async function bulkDeleteSubmissionsAction(submissionIds: string[]) {
  if (submissionIds.length === 0) return;
  await authorizeSubmissions(submissionIds);

  const admin = createAdminClient();

  // Delete files from storage
  const { data: files } = await admin
    .from("submission_files")
    .select("storage_path")
    .in("submission_id", submissionIds);

  if (files && files.length > 0) {
    await admin.storage
      .from("submissions")
      .remove(files.map((f) => f.storage_path));
  }

  const { error } = await admin
    .from("submissions")
    .delete()
    .in("id", submissionIds);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/entries");
}

export async function bulkUpdateStatusAction(submissionIds: string[], status: SubmissionStatus) {
  if (submissionIds.length === 0) return;
  await authorizeSubmissions(submissionIds);

  const admin = createAdminClient();
  const { error } = await admin
    .from("submissions")
    .update({ status })
    .in("id", submissionIds);
  if (error) throw new Error(error.message);

  // Notify partner team members about the bulk update
  const { data: subs } = await admin
    .from("submissions")
    .select("partner_id")
    .in("id", submissionIds)
    .limit(1);

  if (subs && subs.length > 0) {
    const partnerId = subs[0].partner_id;
    const { data: members } = await admin
      .from("partner_members")
      .select("user_id")
      .eq("partner_id", partnerId);

    if (members) {
      const count = submissionIds.length;
      for (const member of members) {
        await createNotification(
          member.user_id,
          "entry_status",
          `${count} entries marked ${STATUS_LABELS[status]}`,
          `${count} submissions were bulk-updated to ${STATUS_LABELS[status]}.`,
          "/dashboard/entries",
        );
      }
    }
  }

  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/entries");
}

export async function getSubmissionsCsvData() {
  const session = await requireSession();
  const account = await getCurrentAccount(session.userId);
  const admin = createAdminClient();

  let query = admin
    .from("submissions")
    .select(
      `id, status, client_name, client_email, submitted_at, created_at, data,
       partners ( name, slug ),
       partner_forms ( id, form_templates ( schema ) )`
    )
    .order("created_at", { ascending: false });

  // Scope to account if not superadmin
  if (account && session.role !== "superadmin") {
    query = query.eq("partner_id", account.id);
  }

  const { data: submissions, error } = await query;
  if (error) throw new Error(error.message);
  return submissions ?? [];
}
