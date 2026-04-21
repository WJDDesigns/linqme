"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema } from "@/lib/forms";
import { updateFormNotificationSettingsAction } from "./form-actions";
import {
  saveWebhookAction,
  deleteWebhookAction,
  testWebhookAction,
  getWebhookDeliveries,
} from "./webhook-actions";
import {
  createSheetsFeedAction,
  updateSheetsFeedAction,
  deleteSheetsFeedAction,
} from "./sheets-actions";

/* ── Types ─────────────────────────────────────────────────────────── */

interface FieldMapping {
  fieldId: string;
  key: string;
}

interface Webhook {
  id: string;
  name: string;
  provider: string;
  webhook_url: string;
  is_enabled: boolean;
  field_map: FieldMapping[] | null;
  signing_secret: string | null;
  created_at: string;
}

interface Delivery {
  id: string;
  status: string;
  status_code: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

interface SheetsFeed {
  id: string;
  spreadsheet_id: string;
  spreadsheet_name: string;
  sheet_name: string;
  field_map: { fieldId: string; column: string }[] | null;
  is_enabled: boolean;
}

const PROVIDERS = [
  { id: "zapier", label: "Zapier", icon: "fa-bolt", color: "text-orange-400", desc: "Connect to 7,000+ apps via Zapier." },
  { id: "make", label: "Make", icon: "fa-gear", color: "text-purple-400", desc: "Connect to Make (Integromat) scenarios." },
  { id: "custom", label: "Custom", icon: "fa-code", color: "text-blue-400", desc: "POST to any URL with HMAC signing." },
];

/* ── Component ─────────────────────────────────────────────────────── */

export default function FormSendToPanel({
  formId,
  schema,
  initialWebhooks,
  initialSheetsFeeds,
  hasSheetsConnection,
  notificationEmails: initialNotifEmails,
  notificationBcc: initialNotifBcc,
  confirmPageHeading: initialConfirmHeading,
  confirmPageBody: initialConfirmBody,
  redirectUrl: initialRedirectUrl,
  partnerEmailSubject: initialPartnerSubject,
  partnerEmailBody: initialPartnerBody,
  clientEmailSubject: initialClientSubject,
  clientEmailBody: initialClientBody,
}: {
  formId: string;
  schema: FormSchema;
  initialWebhooks: Webhook[];
  initialSheetsFeeds: SheetsFeed[];
  hasSheetsConnection: boolean;
  notificationEmails: string[];
  notificationBcc: string[];
  confirmPageHeading: string;
  confirmPageBody: string;
  redirectUrl: string;
  partnerEmailSubject: string;
  partnerEmailBody: string;
  clientEmailSubject: string;
  clientEmailBody: string;
}) {
  const router = useRouter();

  /* ── Email notification state ────────────────────────────────────── */
  const [notifEmails, setNotifEmails] = useState(initialNotifEmails.join(", "));
  const [notifBcc, setNotifBcc] = useState(initialNotifBcc.join(", "));
  const [confirmHeading, setConfirmHeading] = useState(initialConfirmHeading);
  const [confirmBody, setConfirmBody] = useState(initialConfirmBody);
  const [redirectUrl, setRedirectUrl] = useState(initialRedirectUrl);
  const [notifSaving, startNotifSave] = useTransition();
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  /* ── Email template state ──────────────────────────────────────── */
  const [templateTab, setTemplateTab] = useState<"partner" | "client">("partner");
  const [partnerSubject, setPartnerSubject] = useState(initialPartnerSubject);
  const [partnerBody, setPartnerBody] = useState(initialPartnerBody);
  const [clientSubject, setClientSubject] = useState(initialClientSubject);
  const [clientBody, setClientBody] = useState(initialClientBody);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagTarget, setTagTarget] = useState<"subject" | "body">("body");
  const tagPickerRef = useRef<HTMLDivElement>(null);

  const partnerBodyRef = useRef<HTMLTextAreaElement>(null);
  const partnerSubjectRef = useRef<HTMLInputElement>(null);
  const clientBodyRef = useRef<HTMLTextAreaElement>(null);
  const clientSubjectRef = useRef<HTMLInputElement>(null);

  // Gather merge tags from form schema
  const mergeTags = [
    { tag: "{all_fields}", label: "All Fields", desc: "Table of all submitted data" },
    { tag: "{client_name}", label: "Client Name", desc: "Submitter's name" },
    { tag: "{client_email}", label: "Client Email", desc: "Submitter's email" },
    { tag: "{partner_name}", label: "Partner Name", desc: "Your company name" },
    { tag: "{submission_link}", label: "Submission Link", desc: "Link to entry in dashboard" },
    ...schema.steps.flatMap((s) =>
      s.fields
        .filter((f) => f.type !== "heading")
        .map((f) => ({
          tag: `{field:${f.id}}`,
          label: f.label,
          desc: `${s.title} -- ${f.type ?? "text"}`,
        })),
    ),
  ];

  const insertTag = useCallback((tag: string) => {
    const isPartner = templateTab === "partner";
    const ref = tagTarget === "body"
      ? (isPartner ? partnerBodyRef : clientBodyRef)
      : (isPartner ? partnerSubjectRef : clientSubjectRef);
    const setter = tagTarget === "body"
      ? (isPartner ? setPartnerBody : setClientBody)
      : (isPartner ? setPartnerSubject : setClientSubject);

    const el = ref.current;
    if (el) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      setter(before + tag + after);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + tag.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setter((prev) => prev + tag);
    }
    setShowTagPicker(false);
  }, [templateTab, tagTarget]);

  function handleSaveNotifications() {
    setNotifMsg(null);
    startNotifSave(async () => {
      const emails = notifEmails.split(",").map((e) => e.trim()).filter(Boolean);
      const bcc = notifBcc.split(",").map((e) => e.trim()).filter(Boolean);
      const result = await updateFormNotificationSettingsAction(formId, {
        notificationEmails: emails,
        notificationBcc: bcc,
        confirmPageHeading: confirmHeading,
        confirmPageBody: confirmBody,
        redirectUrl,
        partnerEmailSubject: partnerSubject || null,
        partnerEmailBody: partnerBody || null,
        clientEmailSubject: clientSubject || null,
        clientEmailBody: clientBody || null,
      });
      setNotifMsg(result.ok ? "Saved!" : (result.error ?? "Failed."));
      if (result.ok) router.refresh();
    });
  }

  /* ── Webhook state ───────────────────────────────────────────────── */
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [editing, setEditing] = useState<Partial<Webhook> | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showDeliveries, setShowDeliveries] = useState<string | null>(null);
  const [whError, setWhError] = useState<string | null>(null);

  /* ── Sheets feed state ────────────────────────────────────────────── */
  const [sheetsFeeds, setSheetsFeeds] = useState<SheetsFeed[]>(initialSheetsFeeds);
  const [sheetsAdding, startSheetsAdd] = useTransition();
  const [sheetsDeleting, startSheetsDelete] = useTransition();
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [sheetsMsg, setSheetsMsg] = useState<string | null>(null);
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [newSheetMode, setNewSheetMode] = useState<"create" | "existing">("create");
  const [newSheetTitle, setNewSheetTitle] = useState("");
  const [existingSheetUrl, setExistingSheetUrl] = useState("");

  function extractSpreadsheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function handleAddSheetsFeed() {
    setSheetsError(null);
    setSheetsMsg(null);

    if (newSheetMode === "create") {
      if (!newSheetTitle.trim()) { setSheetsError("Enter a spreadsheet title."); return; }
      const headers = ["Submitted At", ...schema.steps.flatMap((s) => s.fields.map((f) => f.label))];
      startSheetsAdd(async () => {
        const result = await createSheetsFeedAction(formId, {
          createNew: true,
          newTitle: newSheetTitle.trim(),
          headers,
        });
        if (result.ok) {
          setSheetsFeeds((prev) => [
            ...prev,
            {
              id: result.id!,
              spreadsheet_id: extractSpreadsheetId(result.spreadsheetUrl ?? "") ?? "",
              spreadsheet_name: newSheetTitle.trim(),
              sheet_name: "Submissions",
              field_map: null,
              is_enabled: true,
            },
          ]);
          setNewSheetTitle("");
          setShowNewSheet(false);
          setSheetsMsg("Spreadsheet created and linked!");
        } else {
          setSheetsError(result.error ?? "Failed to create spreadsheet.");
        }
      });
    } else {
      const spreadsheetId = extractSpreadsheetId(existingSheetUrl);
      if (!spreadsheetId) { setSheetsError("Paste a valid Google Sheets URL."); return; }
      startSheetsAdd(async () => {
        const result = await createSheetsFeedAction(formId, {
          spreadsheetId,
          spreadsheetName: "Linked Sheet",
        });
        if (result.ok) {
          setSheetsFeeds((prev) => [
            ...prev,
            {
              id: result.id!,
              spreadsheet_id: spreadsheetId,
              spreadsheet_name: "Linked Sheet",
              sheet_name: "Sheet1",
              field_map: null,
              is_enabled: true,
            },
          ]);
          setExistingSheetUrl("");
          setShowNewSheet(false);
          setSheetsMsg("Sheet linked!");
        } else {
          setSheetsError(result.error ?? "Failed to link spreadsheet.");
        }
      });
    }
  }

  function handleDeleteSheetsFeed(feedId: string) {
    startSheetsDelete(async () => {
      const result = await deleteSheetsFeedAction(feedId, formId);
      if (result.ok) {
        setSheetsFeeds((prev) => prev.filter((f) => f.id !== feedId));
      }
    });
  }

  function handleToggleSheetsFeed(feedId: string, enabled: boolean) {
    startSheetsAdd(async () => {
      const result = await updateSheetsFeedAction(feedId, formId, { isEnabled: enabled });
      if (result.ok) {
        setSheetsFeeds((prev) => prev.map((f) => f.id === feedId ? { ...f, is_enabled: enabled } : f));
      }
    });
  }

  const allFields = schema.steps.flatMap((s) =>
    s.fields.map((f) => ({ id: f.id, label: f.label, stepTitle: s.title })),
  );

  function handleNew(provider: string) {
    const prov = PROVIDERS.find((p) => p.id === provider);
    setEditing({
      provider,
      name: prov?.label ?? "Webhook",
      webhook_url: "",
      is_enabled: true,
      field_map: null,
      signing_secret: null,
    });
    setWhError(null);
    setTestResult(null);
  }

  function handleEdit(wh: Webhook) {
    setEditing({ ...wh });
    setWhError(null);
    setTestResult(null);
  }

  function handleSave() {
    if (!editing) return;
    setWhError(null);
    startSave(async () => {
      const result = await saveWebhookAction(formId, {
        id: editing.id,
        name: editing.name ?? "Webhook",
        provider: editing.provider ?? "zapier",
        webhookUrl: editing.webhook_url ?? "",
        isEnabled: editing.is_enabled ?? true,
        fieldMap: editing.field_map ?? null,
        signingSecret: editing.signing_secret ?? undefined,
      });
      if (result.ok) {
        if (editing.id) {
          setWebhooks((prev) =>
            prev.map((w) => w.id === editing.id ? { ...w, ...editing, id: w.id } as Webhook : w),
          );
        } else {
          setWebhooks((prev) => [
            ...prev,
            {
              id: result.id!,
              name: editing.name ?? "Webhook",
              provider: editing.provider ?? "zapier",
              webhook_url: editing.webhook_url ?? "",
              is_enabled: editing.is_enabled ?? true,
              field_map: editing.field_map ?? null,
              signing_secret: editing.signing_secret ?? null,
              created_at: new Date().toISOString(),
            },
          ]);
        }
        setEditing(null);
      } else {
        setWhError(result.error ?? "Failed to save.");
      }
    });
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const result = await deleteWebhookAction(id, formId);
      if (result.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        if (editing?.id === id) setEditing(null);
      }
    });
  }

  function handleTest(id: string) {
    setTestResult(null);
    startTest(async () => {
      const result = await testWebhookAction(id);
      setTestResult(result.ok
        ? { ok: true, msg: `Success (${result.statusCode})` }
        : { ok: false, msg: result.error ?? `Failed (${result.statusCode})` });
    });
  }

  async function handleViewDeliveries(webhookId: string) {
    if (showDeliveries === webhookId) { setShowDeliveries(null); return; }
    setShowDeliveries(webhookId);
    setDeliveries(await getWebhookDeliveries(webhookId));
  }

  function toggleFieldMapping() {
    if (!editing) return;
    setEditing(editing.field_map
      ? { ...editing, field_map: null }
      : { ...editing, field_map: allFields.map((f) => ({ fieldId: f.id, key: f.id })) });
  }

  function updateMapping(fieldId: string, key: string) {
    if (!editing?.field_map) return;
    setEditing({ ...editing, field_map: editing.field_map.map((m) => m.fieldId === fieldId ? { ...m, key } : m) });
  }

  function removeMapping(fieldId: string) {
    if (!editing?.field_map) return;
    setEditing({ ...editing, field_map: editing.field_map.filter((m) => m.fieldId !== fieldId) });
  }

  function addMapping(fieldId: string) {
    if (!editing) return;
    const existing = editing.field_map ?? [];
    if (existing.some((m) => m.fieldId === fieldId)) return;
    setEditing({ ...editing, field_map: [...existing, { fieldId, key: fieldId }] });
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold font-headline text-on-surface">Send To</h2>
          <p className="text-sm text-on-surface-variant/60 mt-1">
            Configure where submissions are sent -- email notifications, Google Sheets, Zapier, Make, or custom webhooks.
          </p>
        </div>

        {/* ── Email notifications ───────────────────────────────────── */}
        <section className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center gap-2">
            <i className="fa-solid fa-envelope text-primary/60 text-sm" />
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Email Notifications
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">Recipients</span>
              <p className="text-[11px] text-on-surface-variant/40 mt-0.5 mb-1.5">
                Comma-separated emails. Leave empty to use your default partner owner email.
              </p>
              <input
                value={notifEmails}
                onChange={(e) => setNotifEmails(e.target.value)}
                placeholder="e.g. team@agency.com, lead@agency.com"
                className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">BCC</span>
              <p className="text-[11px] text-on-surface-variant/40 mt-0.5 mb-1.5">
                Blind copy recipients for each notification.
              </p>
              <input
                value={notifBcc}
                onChange={(e) => setNotifBcc(e.target.value)}
                placeholder="e.g. records@agency.com"
                className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none"
              />
            </label>

            {/* ── Email Templates ──────────────────────────────────── */}
            <div className="border-t border-outline-variant/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">Email Templates</h4>
                  <p className="text-[11px] text-on-surface-variant/40 mt-0.5">
                    Customize the emails sent when a form is submitted. Leave blank to use defaults.
                  </p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 mb-4 bg-surface-container-lowest rounded-lg p-0.5">
                <button
                  onClick={() => setTemplateTab("partner")}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition-all ${
                    templateTab === "partner"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-on-surface-variant/50 hover:text-on-surface-variant"
                  }`}
                >
                  <i className="fa-solid fa-building text-[10px] mr-1.5" />
                  Admin Notification
                </button>
                <button
                  onClick={() => setTemplateTab("client")}
                  className={`flex-1 px-3 py-2 text-xs font-bold rounded-md transition-all ${
                    templateTab === "client"
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-on-surface-variant/50 hover:text-on-surface-variant"
                  }`}
                >
                  <i className="fa-solid fa-user text-[10px] mr-1.5" />
                  Client Confirmation
                </button>
              </div>

              {/* Template editor */}
              <div className="space-y-3">
                {/* Subject */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-on-surface">Subject</label>
                    <button
                      onClick={() => { setTagTarget("subject"); setShowTagPicker(!showTagPicker || tagTarget !== "subject"); }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-primary/70 hover:text-primary hover:bg-primary/5 rounded transition-all"
                    >
                      <i className="fa-solid fa-code text-[9px]" />
                      Insert Tag
                    </button>
                  </div>
                  <input
                    ref={templateTab === "partner" ? partnerSubjectRef : clientSubjectRef}
                    value={templateTab === "partner" ? partnerSubject : clientSubject}
                    onChange={(e) => (templateTab === "partner" ? setPartnerSubject : setClientSubject)(e.target.value)}
                    placeholder={templateTab === "partner"
                      ? "New submission -- {client_name} -- {partner_name}"
                      : "We received your info -- {partner_name}"}
                    className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none font-mono text-[13px]"
                  />
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-on-surface">Body</label>
                    <button
                      onClick={() => { setTagTarget("body"); setShowTagPicker(!showTagPicker || tagTarget !== "body"); }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-primary/70 hover:text-primary hover:bg-primary/5 rounded transition-all"
                    >
                      <i className="fa-solid fa-code text-[9px]" />
                      Insert Tag
                    </button>
                  </div>
                  <textarea
                    ref={templateTab === "partner" ? partnerBodyRef : clientBodyRef}
                    value={templateTab === "partner" ? partnerBody : clientBody}
                    onChange={(e) => (templateTab === "partner" ? setPartnerBody : setClientBody)(e.target.value)}
                    placeholder={templateTab === "partner"
                      ? "{client_name} submitted their form.\n\nClient email: {client_email}\n\n{all_fields}"
                      : "Thanks, {client_name}! Your info has been received by {partner_name}.\n\n{all_fields}"}
                    rows={6}
                    className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none resize-none font-mono text-[13px] leading-relaxed"
                  />
                  <p className="text-[11px] text-on-surface-variant/40 mt-1.5">
                    Use merge tags to insert dynamic data. <span className="font-mono text-[10px] text-primary/50">{"{all_fields}"}</span> inserts a table of all submitted data.
                  </p>
                </div>

                {/* Tag picker dropdown */}
                {showTagPicker && (
                  <div ref={tagPickerRef} className="rounded-xl border border-outline-variant/15 bg-surface-container overflow-hidden shadow-xl shadow-black/20">
                    <div className="px-3 py-2 border-b border-outline-variant/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                        Merge Tags
                      </span>
                      <button
                        onClick={() => setShowTagPicker(false)}
                        className="text-on-surface-variant/40 hover:text-on-surface text-xs"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-outline-variant/5">
                      {mergeTags.map((t) => (
                        <button
                          key={t.tag}
                          onClick={() => insertTag(t.tag)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left"
                        >
                          <code className="text-[11px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded shrink-0">
                            {t.tag}
                          </code>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-on-surface truncate">{t.label}</p>
                            <p className="text-[10px] text-on-surface-variant/40 truncate">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset to default link */}
                {((templateTab === "partner" && (partnerSubject || partnerBody)) ||
                  (templateTab === "client" && (clientSubject || clientBody))) && (
                  <button
                    onClick={() => {
                      if (templateTab === "partner") {
                        setPartnerSubject("");
                        setPartnerBody("");
                      } else {
                        setClientSubject("");
                        setClientBody("");
                      }
                    }}
                    className="text-[11px] font-medium text-on-surface-variant/50 hover:text-error transition-colors"
                  >
                    <i className="fa-solid fa-rotate-left text-[9px] mr-1" />
                    Reset to default template
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-outline-variant/10 pt-4">
              <h4 className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest mb-3">After Submission</h4>

              <label className="block mb-4">
                <span className="text-xs font-medium text-on-surface">Redirect URL</span>
                <p className="text-[11px] text-on-surface-variant/40 mt-0.5 mb-1.5">
                  Redirect clients to a custom URL instead of the confirmation page.
                </p>
                <input
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://youragency.com/thank-you"
                  className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </label>

              <label className="block mb-4">
                <span className="text-xs font-medium text-on-surface">Confirmation heading</span>
                <input
                  value={confirmHeading}
                  onChange={(e) => setConfirmHeading(e.target.value)}
                  placeholder="Thank you for your submission!"
                  className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none mt-1.5"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-on-surface">Confirmation body</span>
                <textarea
                  value={confirmBody}
                  onChange={(e) => setConfirmBody(e.target.value)}
                  placeholder="We'll review your information and get back to you shortly."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none resize-none mt-1.5"
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveNotifications}
                disabled={notifSaving}
                className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all disabled:opacity-60"
              >
                {notifSaving ? "Saving..." : "Save Email Settings"}
              </button>
              {notifMsg && (
                <span className={`text-xs font-medium ${notifMsg === "Saved!" ? "text-tertiary" : "text-error"}`}>
                  {notifMsg}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Google Sheets ────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-table text-emerald-400 text-sm" />
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Google Sheets
            </h3>
          </div>

          {!hasSheetsConnection ? (
            <div className="glass-panel rounded-xl border border-outline-variant/15 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-table text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface mb-1">Connect Google Sheets</p>
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed mb-3">
                    Automatically sync every submission to a Google Spreadsheet in real time.
                    Connect your Google account first from the Integrations page.
                  </p>
                  <a
                    href="/dashboard/integrations"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    <i className="fa-solid fa-plug text-[10px]" />
                    Go to Integrations
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Existing feeds */}
              {sheetsFeeds.length > 0 && (
                <div className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
                  <div className="divide-y divide-outline-variant/5">
                    {sheetsFeeds.map((feed) => (
                      <div key={feed.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-table text-emerald-400 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-on-surface truncate">
                              {feed.spreadsheet_name || "Linked Sheet"}
                            </p>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                              feed.is_enabled ? "text-tertiary bg-tertiary/10" : "text-on-surface-variant/40 bg-surface-container-high"
                            }`}>
                              {feed.is_enabled ? "Active" : "Off"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant/40 truncate mt-0.5">
                            Tab: {feed.sheet_name} -- {feed.field_map ? `${feed.field_map.length} mapped fields` : "All fields (auto)"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`https://docs.google.com/spreadsheets/d/${feed.spreadsheet_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-emerald-400/30 hover:text-emerald-400 transition-all"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[9px] mr-1" />Open
                          </a>
                          <button
                            onClick={() => handleToggleSheetsFeed(feed.id, !feed.is_enabled)}
                            className={`px-2.5 py-1.5 text-[10px] font-bold border rounded-lg transition-all ${
                              feed.is_enabled
                                ? "text-on-surface-variant border-outline-variant/20 hover:border-orange-400/30 hover:text-orange-400"
                                : "text-primary border-primary/20 hover:bg-primary/10"
                            }`}
                          >
                            {feed.is_enabled ? "Pause" : "Resume"}
                          </button>
                          <button
                            onClick={() => handleDeleteSheetsFeed(feed.id)}
                            disabled={sheetsDeleting}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-error border border-error/20 rounded-lg hover:bg-error/10 transition-all disabled:opacity-50"
                          >
                            <i className="fa-solid fa-trash text-[9px]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success / error messages */}
              {sheetsMsg && (
                <div className="rounded-xl border bg-tertiary/10 border-tertiary/20 px-4 py-3 text-sm font-medium text-tertiary">
                  <i className="fa-solid fa-circle-check mr-2" />{sheetsMsg}
                </div>
              )}
              {sheetsError && (
                <div className="rounded-xl border bg-error/10 border-error/20 px-4 py-3 text-sm font-medium text-error">
                  <i className="fa-solid fa-circle-xmark mr-2" />{sheetsError}
                </div>
              )}

              {/* Add new sheet */}
              {!showNewSheet ? (
                <button
                  onClick={() => { setShowNewSheet(true); setSheetsError(null); setSheetsMsg(null); }}
                  className="glass-panel rounded-xl border border-dashed border-outline-variant/20 p-4 w-full hover:border-emerald-400/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                      <i className="fa-solid fa-plus text-on-surface-variant/40 group-hover:text-emerald-400 text-sm transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Add Google Sheet</p>
                      <p className="text-[11px] text-on-surface-variant/40">Create a new spreadsheet or link an existing one.</p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
                  <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      Add Google Sheet
                    </h4>
                    <button
                      onClick={() => { setShowNewSheet(false); setSheetsError(null); }}
                      className="text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewSheetMode("create")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                          newSheetMode === "create"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-400/20"
                            : "text-on-surface-variant/60 border-outline-variant/15 hover:border-emerald-400/30"
                        }`}
                      >
                        <i className="fa-solid fa-file-circle-plus text-[11px]" />
                        Create New
                      </button>
                      <button
                        onClick={() => setNewSheetMode("existing")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                          newSheetMode === "existing"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-400/20"
                            : "text-on-surface-variant/60 border-outline-variant/15 hover:border-emerald-400/30"
                        }`}
                      >
                        <i className="fa-solid fa-link text-[11px]" />
                        Link Existing
                      </button>
                    </div>

                    {newSheetMode === "create" ? (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant/60 mb-1.5">Spreadsheet Title</label>
                        <input
                          value={newSheetTitle}
                          onChange={(e) => setNewSheetTitle(e.target.value)}
                          placeholder={`${schema.steps[0]?.title ?? "Form"} Submissions`}
                          className="block w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-emerald-400/40 outline-none"
                        />
                        <p className="text-[11px] text-on-surface-variant/40 mt-1.5">
                          A new Google Sheet will be created in your connected account with column headers matching your form fields.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant/60 mb-1.5">Spreadsheet URL</label>
                        <input
                          value={existingSheetUrl}
                          onChange={(e) => setExistingSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="block w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-emerald-400/40 outline-none font-mono"
                        />
                        <p className="text-[11px] text-on-surface-variant/40 mt-1.5">
                          Paste the full URL of a Google Sheet you own. Submissions will be appended as new rows to Sheet1.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => { setShowNewSheet(false); setSheetsError(null); }}
                        className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-emerald-400/30 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSheetsFeed}
                        disabled={sheetsAdding}
                        className="px-5 py-2 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-60"
                      >
                        {sheetsAdding ? "Working..." : newSheetMode === "create" ? "Create & Link" : "Link Sheet"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Help text when no feeds */}
              {sheetsFeeds.length === 0 && !showNewSheet && (
                <div className="glass-panel rounded-xl border border-outline-variant/15 p-5">
                  <p className="text-xs text-on-surface-variant/60 leading-relaxed">
                    Link a Google Sheet to automatically sync every submission as a new row.
                    Create a new spreadsheet with auto-generated headers, or link an existing one.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Webhooks ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bolt text-primary/60 text-sm" />
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Webhook Feeds
            </h3>
          </div>

          {/* Add new */}
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleNew(p.id)}
                  className="glass-panel rounded-xl border border-outline-variant/15 p-4 hover:border-primary/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center">
                      <i className={`fa-solid ${p.icon} ${p.color}`} />
                    </div>
                    <span className="text-sm font-bold text-on-surface">{p.label}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/60">{p.desc}</p>
                  <span className="text-xs text-primary font-bold mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                    Add <i className="fa-solid fa-plus text-[10px] ml-1" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Existing webhooks */}
          {!editing && webhooks.length > 0 && (
            <div className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
              <div className="divide-y divide-outline-variant/5">
                {webhooks.map((wh) => {
                  const prov = PROVIDERS.find((p) => p.id === wh.provider);
                  return (
                    <div key={wh.id}>
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                          <i className={`fa-solid ${prov?.icon ?? "fa-bolt"} ${prov?.color ?? "text-primary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-on-surface truncate">{wh.name}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                              wh.is_enabled ? "text-tertiary bg-tertiary/10" : "text-on-surface-variant/40 bg-surface-container-high"
                            }`}>
                              {wh.is_enabled ? "Active" : "Off"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant/40 truncate mt-0.5">{wh.webhook_url}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleTest(wh.id)} disabled={testing}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-primary/30 hover:text-primary transition-all disabled:opacity-50">
                            <i className="fa-solid fa-paper-plane text-[9px] mr-1" />Test
                          </button>
                          <button onClick={() => handleViewDeliveries(wh.id)}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-primary/30 hover:text-primary transition-all">
                            <i className="fa-solid fa-list text-[9px] mr-1" />Log
                          </button>
                          <button onClick={() => handleEdit(wh)}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-all">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(wh.id)} disabled={deleting}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-error border border-error/20 rounded-lg hover:bg-error/10 transition-all disabled:opacity-50">
                            <i className="fa-solid fa-trash text-[9px]" />
                          </button>
                        </div>
                      </div>

                      {/* Delivery log */}
                      {showDeliveries === wh.id && (
                        <div className="px-5 pb-4">
                          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/10 overflow-hidden">
                            <div className="px-4 py-2 border-b border-outline-variant/10">
                              <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Recent Deliveries</span>
                            </div>
                            {deliveries.length === 0 ? (
                              <div className="px-4 py-6 text-center text-xs text-on-surface-variant/40">
                                No deliveries yet. Submit a form or use the Test button.
                              </div>
                            ) : (
                              <div className="divide-y divide-outline-variant/5">
                                {deliveries.map((d) => (
                                  <div key={d.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === "success" ? "bg-tertiary" : "bg-error"}`} />
                                    <span className="font-medium text-on-surface">
                                      {d.status === "success" ? "OK" : "Failed"}{d.status_code && ` (${d.status_code})`}
                                    </span>
                                    {d.duration_ms != null && <span className="text-on-surface-variant/40">{d.duration_ms}ms</span>}
                                    {d.error_message && <span className="text-error/60 truncate flex-1">{d.error_message}</span>}
                                    <span className="text-on-surface-variant/30 shrink-0">{new Date(d.created_at).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              testResult.ok ? "bg-tertiary/10 border-tertiary/20 text-tertiary" : "bg-error/10 border-error/20 text-error"
            }`}>
              <i className={`fa-solid ${testResult.ok ? "fa-circle-check" : "fa-circle-xmark"} mr-2`} />
              {testResult.msg}
            </div>
          )}

          {/* Webhook editor */}
          {editing && (
            <div className="glass-panel rounded-2xl border border-outline-variant/15 overflow-hidden">
              <div className="px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {editing.id ? "Edit Webhook" : "New Webhook"}
                </h4>
                <button onClick={() => { setEditing(null); setWhError(null); }}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors">Cancel</button>
              </div>
              <div className="p-5 space-y-5">
                {/* Provider */}
                <div className="flex gap-2">
                  {PROVIDERS.map((p) => (
                    <button key={p.id} onClick={() => setEditing({ ...editing, provider: p.id })}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                        editing.provider === p.id
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "text-on-surface-variant/60 border-outline-variant/15 hover:border-primary/30"
                      }`}>
                      <i className={`fa-solid ${p.icon} ${editing.provider === p.id ? "text-primary" : p.color}`} />
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant/60 mb-1.5">Name</label>
                  <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="block w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none"
                    placeholder="e.g. Send to Slack via Zapier" />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant/60 mb-1.5">Webhook URL</label>
                  <input value={editing.webhook_url ?? ""} onChange={(e) => setEditing({ ...editing, webhook_url: e.target.value })}
                    className="block w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                    placeholder={editing.provider === "make" ? "https://hook.us1.make.com/..." : "https://hooks.zapier.com/hooks/catch/..."} />
                  <p className="text-[11px] text-on-surface-variant/40 mt-1.5">
                    {editing.provider === "zapier" && 'Create a Zap with "Webhooks by Zapier" as the trigger, choose "Catch Hook", and paste the URL here.'}
                    {editing.provider === "make" && 'Add a "Custom Webhook" module in Make and paste the webhook URL here.'}
                    {editing.provider === "custom" && "Enter any HTTPS endpoint that accepts POST requests with JSON."}
                  </p>
                </div>

                {/* Signing secret (custom) */}
                {editing.provider === "custom" && (
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant/60 mb-1.5">
                      Signing Secret <span className="font-normal text-on-surface-variant/40">(optional)</span>
                    </label>
                    <input value={editing.signing_secret ?? ""} onChange={(e) => setEditing({ ...editing, signing_secret: e.target.value })}
                      className="block w-full px-3 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                      placeholder="whsec_..." />
                    <p className="text-[11px] text-on-surface-variant/40 mt-1.5">
                      Payload signed with HMAC-SHA256 in the X-Linqme-Signature header.
                    </p>
                  </div>
                )}

                {/* Enabled */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface">Enabled</p>
                    <p className="text-[11px] text-on-surface-variant/40">Submissions won&apos;t fire this webhook when disabled.</p>
                  </div>
                  <button onClick={() => setEditing({ ...editing, is_enabled: !editing.is_enabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${editing.is_enabled ? "bg-primary" : "bg-surface-container-highest"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editing.is_enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Field mapping */}
                <div className="border-t border-outline-variant/10 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Field Mapping</p>
                      <p className="text-[11px] text-on-surface-variant/40">
                        {editing.field_map ? "Choose which fields to send and customize key names." : "All form fields will be sent. Enable mapping to customize."}
                      </p>
                    </div>
                    <button onClick={toggleFieldMapping}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        editing.field_map ? "bg-primary/10 text-primary border-primary/20" : "text-on-surface-variant/60 border-outline-variant/15 hover:border-primary/30"
                      }`}>
                      {editing.field_map ? "Send All Fields" : "Customize Fields"}
                    </button>
                  </div>

                  {editing.field_map && (
                    <div className="space-y-2">
                      {editing.field_map.map((m) => {
                        const field = allFields.find((f) => f.id === m.fieldId);
                        return (
                          <div key={m.fieldId} className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-on-surface truncate">{field?.label ?? m.fieldId}</p>
                              <p className="text-[10px] text-on-surface-variant/40">{field?.stepTitle}</p>
                            </div>
                            <i className="fa-solid fa-arrow-right text-[9px] text-on-surface-variant/30 shrink-0" />
                            <input value={m.key} onChange={(e) => updateMapping(m.fieldId, e.target.value)}
                              className="w-36 px-2 py-1.5 text-xs bg-surface-container border-0 rounded text-on-surface font-mono focus:ring-1 focus:ring-primary/40 outline-none"
                              placeholder="key_name" />
                            <button onClick={() => removeMapping(m.fieldId)} className="text-on-surface-variant/30 hover:text-error transition-colors shrink-0">
                              <i className="fa-solid fa-xmark text-xs" />
                            </button>
                          </div>
                        );
                      })}
                      {allFields.filter((f) => !editing.field_map?.some((m) => m.fieldId === f.id)).length > 0 && (
                        <div className="pt-2">
                          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest mb-1.5">Available Fields</p>
                          <div className="flex flex-wrap gap-1.5">
                            {allFields.filter((f) => !editing.field_map?.some((m) => m.fieldId === f.id)).map((f) => (
                              <button key={f.id} onClick={() => addMapping(f.id)}
                                className="px-2.5 py-1 text-[10px] text-on-surface-variant/60 bg-surface-container-highest rounded-full hover:text-primary hover:bg-primary/10 transition-all">
                                <i className="fa-solid fa-plus text-[8px] mr-1" />{f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {whError && (
                  <div className="rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-xs text-error font-medium">{whError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={() => { setEditing(null); setWhError(null); }}
                    className="px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant/20 rounded-lg hover:border-primary/30 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all disabled:opacity-60">
                    {saving ? "Saving..." : editing.id ? "Update Webhook" : "Add Webhook"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help */}
          {!editing && webhooks.length === 0 && (
            <div className="glass-panel rounded-xl border border-outline-variant/15 p-5">
              <p className="text-xs text-on-surface-variant/60 leading-relaxed">
                Add a webhook to automatically send submission data to Zapier, Make, or any custom endpoint when a client submits this form.
                Click a provider above to get started.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
