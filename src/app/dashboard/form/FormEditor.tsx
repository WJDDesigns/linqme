"use client";

import { useState, useCallback, useRef } from "react";
import type { FormSchema, StepDef, FieldDef, FieldType } from "@/lib/forms";
import { saveFormSchemaAction } from "./actions";

/* ── Field type catalogue ──────────────────────────────────── */

interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: string;
  group: "standard" | "advanced";
}

const FIELD_CATALOGUE: FieldTypeInfo[] = [
  { type: "text", label: "Short Text", icon: "Aa", group: "standard" },
  { type: "textarea", label: "Long Text", icon: "\u00b6", group: "standard" },
  { type: "email", label: "Email", icon: "@", group: "standard" },
  { type: "tel", label: "Phone", icon: "\u260e", group: "standard" },
  { type: "number", label: "Number", icon: "#", group: "standard" },
  { type: "select", label: "Dropdown", icon: "\u25be", group: "standard" },
  { type: "checkbox", label: "Checkbox", icon: "\u2611", group: "standard" },
  { type: "url", label: "URL", icon: "\ud83d\udd17", group: "advanced" },
  { type: "file", label: "File Upload", icon: "\ud83d\udcce", group: "advanced" },
  { type: "files", label: "Multi-File", icon: "\ud83d\udcc1", group: "advanced" },
];

function iconFor(type: FieldType) {
  return FIELD_CATALOGUE.find((c) => c.type === type)?.icon ?? "?";
}
function labelFor(type: FieldType) {
  return FIELD_CATALOGUE.find((c) => c.type === type)?.label ?? type;
}

/* ── Helpers ───────────────────────────────────────────────── */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeField(type: FieldType, label: string): FieldDef {
  const base: FieldDef = { id: `field_${uid()}`, type, label, required: false };
  if (type === "select") base.options = ["Option 1", "Option 2"];
  if (type === "textarea") base.rows = 4;
  return base;
}

function makeStep(): StepDef {
  return { id: `step_${uid()}`, title: "New Step", description: "", fields: [] };
}

/* ── Drag payload types ────────────────────────────────────── */

type DragPayload =
  | { kind: "palette"; fieldType: FieldType; label: string }
  | { kind: "field"; sourceStepId: string; fieldId: string };

/* ── Input classes ─────────────────────────────────────────── */

const INPUT_CLS =
  "block w-full px-3 py-2 text-sm bg-surface-container-highest/50 border-0 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 outline-none transition-all";

/* ── Main editor ───────────────────────────────────────────── */

export default function FormEditor({ initialSchema }: { initialSchema: FormSchema }) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(schema.steps.map((s) => s.id)),
  );

  const dragPayload = useRef<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<{ stepId: string; index: number } | null>(null);

  const updateSteps = useCallback((fn: (steps: StepDef[]) => StepDef[]) => {
    setSchema((prev) => ({ steps: fn([...prev.steps]) }));
    setMessage(null);
  }, []);

  const selectedStep = schema.steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedField = selectedStep?.fields.find((f) => f.id === selectedFieldId) ?? null;

  function selectField(stepId: string, fieldId: string) {
    setSelectedStepId(stepId);
    setSelectedFieldId(fieldId);
  }
  function clearSelection() {
    setSelectedStepId(null);
    setSelectedFieldId(null);
  }

  function addStep() {
    const s = makeStep();
    updateSteps((steps) => [...steps, s]);
    setExpandedSteps((prev) => new Set(prev).add(s.id));
  }
  function removeStep(stepId: string) {
    if (schema.steps.length <= 1) return;
    updateSteps((steps) => steps.filter((s) => s.id !== stepId));
    if (selectedStepId === stepId) clearSelection();
  }
  function moveStep(stepId: string, dir: -1 | 1) {
    updateSteps((steps) => {
      const i = steps.findIndex((s) => s.id === stepId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= steps.length) return steps;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return steps;
    });
  }
  function updateStepMeta(stepId: string, patch: Partial<StepDef>) {
    updateSteps((steps) => steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)));
  }
  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
  }

  function insertField(stepId: string, index: number, field: FieldDef) {
    updateSteps((steps) =>
      steps.map((s) => {
        if (s.id !== stepId) return s;
        const fields = [...s.fields];
        fields.splice(index, 0, field);
        return { ...s, fields };
      }),
    );
  }
  function removeField(stepId: string, fieldId: string) {
    updateSteps((steps) =>
      steps.map((s) =>
        s.id === stepId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s,
      ),
    );
    if (selectedFieldId === fieldId) clearSelection();
  }
  function updateField(stepId: string, fieldId: string, patch: Partial<FieldDef>) {
    updateSteps((steps) =>
      steps.map((s) =>
        s.id === stepId
          ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : s,
      ),
    );
  }

  /* ── Drag handlers ─────────────────────────────────────── */
  function startDragPalette(type: FieldType, label: string) {
    dragPayload.current = { kind: "palette", fieldType: type, label };
  }
  function startDragField(stepId: string, fieldId: string) {
    dragPayload.current = { kind: "field", sourceStepId: stepId, fieldId };
  }
  function handleDragOverField(e: React.DragEvent, stepId: string, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ stepId, index });
  }
  function handleDragOverStep(e: React.DragEvent, stepId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const step = schema.steps.find((s) => s.id === stepId);
    setDropTarget({ stepId, index: step?.fields.length ?? 0 });
  }
  function handleDragEnd() {
    dragPayload.current = null;
    setDropTarget(null);
  }
  function handleDrop(e: React.DragEvent, stepId: string, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const payload = dragPayload.current;
    if (!payload) return;

    if (payload.kind === "palette") {
      const field = makeField(payload.fieldType, payload.label);
      insertField(stepId, index, field);
      selectField(stepId, field.id);
    } else {
      const sourceStep = schema.steps.find((s) => s.id === payload.sourceStepId);
      const field = sourceStep?.fields.find((f) => f.id === payload.fieldId);
      if (!field) return;

      let adjustedIndex = index;
      if (payload.sourceStepId === stepId) {
        const oldIndex = sourceStep!.fields.findIndex((f) => f.id === payload.fieldId);
        if (oldIndex < index) adjustedIndex--;
      }

      setSchema((prev) => {
        const steps = prev.steps.map((s) => {
          if (s.id === payload.sourceStepId) {
            return { ...s, fields: s.fields.filter((f) => f.id !== payload.fieldId) };
          }
          return s;
        }).map((s) => {
          if (s.id === stepId) {
            const fields = [...s.fields];
            const insertAt = payload.sourceStepId === stepId
              ? Math.min(adjustedIndex, fields.length)
              : Math.min(index, fields.length);
            fields.splice(insertAt, 0, field);
            return { ...s, fields };
          }
          return s;
        });
        return { steps };
      });
      selectField(stepId, field.id);
    }

    dragPayload.current = null;
    setDropTarget(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveFormSchemaAction(JSON.stringify(schema));
    setSaving(false);
    setMessage(result.ok ? { kind: "ok", text: "Form saved!" } : { kind: "err", text: result.error ?? "Save failed." });
  }

  return (
    <div className="flex gap-0 min-h-[600px] -mx-6 md:-mx-10 -mt-8">
      {/* LEFT: Field Library */}
      <div className="w-72 shrink-0 bg-surface-container-low/50 p-6 overflow-y-auto border-r border-outline-variant/10">
        {selectedField && selectedStep ? (
          <FieldSettingsPanel
            field={selectedField}
            onUpdate={(patch) => updateField(selectedStepId!, selectedFieldId!, patch)}
            onClose={clearSelection}
          />
        ) : (
          <FieldPalette onDragStart={startDragPalette} onClickAdd={(type, label) => {
            const target = schema.steps.find((s) => expandedSteps.has(s.id)) ?? schema.steps[0];
            if (!target) return;
            const field = makeField(type, label);
            insertField(target.id, target.fields.length, field);
            selectField(target.id, field.id);
          }} />
        )}
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 bg-surface overflow-y-auto p-8 md:p-12 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-8">
          {schema.steps.map((step, si) => {
            const isExpanded = expandedSteps.has(step.id);
            return (
              <div key={step.id} className="relative flex flex-col items-center">
                <div className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                  {/* Step header */}
                  <div className="flex items-center gap-3 px-6 py-4">
                    <button onClick={() => toggleStep(step.id)} className="text-on-surface-variant hover:text-on-surface text-sm w-5">
                      {isExpanded ? "\u25be" : "\u25b8"}
                    </button>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-on-primary font-bold">
                      {si + 1}
                    </div>
                    <input
                      value={step.title}
                      onChange={(e) => updateStepMeta(step.id, { title: e.target.value })}
                      className="text-sm font-bold text-on-surface bg-transparent border-none outline-none flex-1 min-w-0"
                      placeholder="Step title"
                    />
                    <span className="text-xs text-on-surface-variant/60 whitespace-nowrap">
                      {step.fields.length} field{step.fields.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button disabled={si === 0} onClick={() => moveStep(step.id, -1)} className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30 text-sm">&uarr;</button>
                      <button disabled={si === schema.steps.length - 1} onClick={() => moveStep(step.id, 1)} className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30 text-sm">&darr;</button>
                      <button disabled={schema.steps.length <= 1} onClick={() => removeStep(step.id)} className="p-1 text-on-surface-variant hover:text-error disabled:opacity-30 text-sm ml-1">&times;</button>
                    </div>
                  </div>

                  {/* Step body */}
                  {isExpanded && (
                    <div
                      className="px-6 pb-6 space-y-2"
                      onDragOver={(e) => handleDragOverStep(e, step.id)}
                      onDrop={(e) => handleDrop(e, step.id, step.fields.length)}
                    >
                      <input
                        value={step.description ?? ""}
                        onChange={(e) => updateStepMeta(step.id, { description: e.target.value })}
                        placeholder="Step description (optional)"
                        className="w-full text-xs text-on-surface-variant bg-transparent border-none outline-none mb-2"
                      />

                      {step.fields.length === 0 && !dropTarget && (
                        <div className="text-center py-10 text-sm text-on-surface-variant border-2 border-dashed border-outline-variant/20 rounded-xl">
                          Drag a field here or click one from the panel
                        </div>
                      )}

                      {step.fields.map((field, fi) => {
                        const isSelected = selectedStepId === step.id && selectedFieldId === field.id;
                        const isDropBefore = dropTarget?.stepId === step.id && dropTarget?.index === fi;

                        return (
                          <div key={field.id}>
                            {isDropBefore && (
                              <div className="h-0.5 bg-primary rounded-full mx-2 my-1" />
                            )}
                            <div
                              draggable
                              onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; startDragField(step.id, field.id); }}
                              onDragOver={(e) => handleDragOverField(e, step.id, fi)}
                              onDrop={(e) => handleDrop(e, step.id, fi)}
                              onDragEnd={handleDragEnd}
                              onClick={() => selectField(step.id, field.id)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary/10 border border-primary/40"
                                  : "bg-surface-container-low border border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-high"
                              }`}
                            >
                              <div className="text-on-surface-variant/40 hover:text-on-surface-variant cursor-grab text-xs select-none">{"\u2807"}</div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                isSelected ? "bg-primary/20 text-primary" : "bg-surface-container-highest text-primary"
                              }`}>
                                {iconFor(field.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-on-surface truncate">{field.label}</div>
                                <div className="text-xs text-on-surface-variant/60">
                                  {labelFor(field.type)}
                                  {field.required && <span className="ml-1 text-tertiary font-medium">&middot; Required</span>}
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeField(step.id, field.id); }}
                                className="p-1 text-on-surface-variant/40 hover:text-error text-sm transition-colors"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {dropTarget?.stepId === step.id && dropTarget?.index === step.fields.length && step.fields.length > 0 && (
                        <div className="h-0.5 bg-primary rounded-full mx-2 my-1" />
                      )}
                    </div>
                  )}
                </div>
                {/* Connector line */}
                {si < schema.steps.length - 1 && (
                  <div className="h-8 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                )}
              </div>
            );
          })}

          {/* Add step */}
          <button
            onClick={addStep}
            className="w-full h-20 border-2 border-dashed border-outline-variant/20 rounded-2xl flex flex-col items-center justify-center gap-1 group hover:border-primary/40 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors text-lg">+</div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Add New Step</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Settings */}
      <div className="w-80 shrink-0 bg-surface-container-low/50 p-6 overflow-y-auto border-l border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          {message && (
            <span className={`text-xs font-medium ${message.kind === "ok" ? "text-tertiary" : "text-error"}`}>
              {message.text}
            </span>
          )}
          <button
            disabled={saving}
            onClick={handleSave}
            className="ml-auto px-6 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] disabled:opacity-60 transition-all"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
        </div>

        {selectedField && selectedStep ? (
          <FieldSettingsPanel
            field={selectedField}
            onUpdate={(patch) => updateField(selectedStepId!, selectedFieldId!, patch)}
            onClose={clearSelection}
          />
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Quick Info</div>
            <div className="glass-panel rounded-xl p-4 border border-outline-variant/10">
              <p className="text-xs text-on-surface-variant">
                Click a field on the canvas to edit its settings here. Drag fields from the left panel to add them to steps.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Field palette ─────────────────────────────────────────── */

function FieldPalette({ onDragStart, onClickAdd }: {
  onDragStart: (type: FieldType, label: string) => void;
  onClickAdd: (type: FieldType, label: string) => void;
}) {
  const standard = FIELD_CATALOGUE.filter((f) => f.group === "standard");
  const advanced = FIELD_CATALOGUE.filter((f) => f.group === "advanced");

  return (
    <div>
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Field Types</h3>
      <div className="space-y-3">
        {standard.map((f) => (
          <button
            key={f.type}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(f.type, f.label); }}
            onClick={() => onClickAdd(f.type, f.label)}
            className="w-full p-3 bg-surface-container rounded-xl border border-outline-variant/10 cursor-grab hover:border-primary/40 hover:bg-surface-container-high transition-all flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors text-sm">
              {f.icon}
            </div>
            <span className="text-sm font-medium text-on-surface">{f.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-8 mb-4">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Advanced</h3>
      </div>
      <div className="space-y-3">
        {advanced.map((f) => (
          <button
            key={f.type}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(f.type, f.label); }}
            onClick={() => onClickAdd(f.type, f.label)}
            className="w-full p-3 bg-surface-container rounded-xl border border-outline-variant/10 cursor-grab hover:border-primary/40 hover:bg-surface-container-high transition-all flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors text-sm">
              {f.icon}
            </div>
            <span className="text-sm font-medium text-on-surface">{f.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Structure</h3>
        <div className="p-4 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-on-surface-variant gap-2 text-center">
          <span className="text-2xl">+</span>
          <p className="text-xs">Drop logic block here</p>
        </div>
      </div>
    </div>
  );
}

/* ── Field settings panel ──────────────────────────────────── */

function FieldSettingsPanel({ field, onUpdate, onClose }: {
  field: FieldDef;
  onUpdate: (patch: Partial<FieldDef>) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-primary text-lg">{iconFor(field.type)}</span>
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex-1">Field Settings</h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-sm p-1 transition-colors">&times;</button>
      </div>
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Labels &amp; Content</div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-medium text-on-surface-variant mb-1 block">Field Label</span>
              <input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} className={INPUT_CLS} />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-on-surface-variant mb-1 block">Field Type</span>
              <select value={field.type} onChange={(e) => onUpdate({ type: e.target.value as FieldType })} className={INPUT_CLS}>
                {FIELD_CATALOGUE.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-on-surface-variant mb-1 block">Helper Text</span>
              <textarea value={field.hint ?? ""} onChange={(e) => onUpdate({ hint: e.target.value || undefined })} placeholder="Appears below the field" rows={2} className={INPUT_CLS} />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-on-surface-variant mb-1 block">Placeholder</span>
              <input value={field.placeholder ?? ""} onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })} placeholder="Placeholder text..." className={INPUT_CLS} />
            </label>
          </div>
        </section>

        {field.type === "select" && (
          <section className="space-y-3">
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Choices</div>
            <textarea value={(field.options ?? []).join("\n")} onChange={(e) => onUpdate({ options: e.target.value.split("\n").filter((l) => l.trim()) })} rows={5} placeholder="One option per line" className={`${INPUT_CLS} font-mono`} />
          </section>
        )}

        {field.type === "textarea" && (
          <section className="space-y-3">
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Appearance</div>
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-on-surface-variant">Rows</span>
              <input type="number" min={2} max={20} value={field.rows ?? 4} onChange={(e) => onUpdate({ rows: Number(e.target.value) || 4 })} className="w-16 px-2 py-1 text-sm bg-surface-container-highest/50 border-0 rounded-lg text-on-surface outline-none" />
            </label>
          </section>
        )}

        {(field.type === "file" || field.type === "files") && (
          <section className="space-y-3">
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">File Settings</div>
            <label className="block">
              <span className="text-[11px] font-medium text-on-surface-variant mb-1 block">Allowed types</span>
              <input value={field.accept ?? ""} onChange={(e) => onUpdate({ accept: e.target.value || undefined })} placeholder="e.g. image/*,.pdf,.doc" className={INPUT_CLS} />
            </label>
          </section>
        )}

        <section className="space-y-3">
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Logic &amp; Rules</div>
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
            <span className="text-xs font-medium text-on-surface">Required Field</span>
            <label className="relative cursor-pointer">
              <input type="checkbox" checked={!!field.required} onChange={(e) => onUpdate({ required: e.target.checked })} className="sr-only peer" />
              <div className="w-8 h-4 bg-surface-container-highest rounded-full peer-checked:bg-primary transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-on-surface-variant rounded-full peer-checked:translate-x-4 peer-checked:bg-on-primary transition-all" />
            </label>
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 bg-error-container/20 text-error rounded-xl font-bold text-xs uppercase tracking-widest border border-error/20 hover:bg-error-container/40 transition-all"
          >
            Delete Component
          </button>
        </div>
      </div>
    </div>
  );
}
