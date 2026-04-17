"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { FormSchema, StepDef, FieldDef, ShowCondition } from "@/lib/forms";

/* ── Types ────────────────────────────────────────────────── */

interface RuleNode {
  id: string;
  type: "field" | "step";
  label: string;
  fieldType?: string;
  stepTitle?: string;
  stepIdx: number;
  condition?: ShowCondition;
}

interface Connection {
  sourceId: string;
  targetId: string;
  operator: string;
  value?: string;
}

const OPERATOR_LABELS: Record<string, string> = {
  equals: "=",
  not_equals: "≠",
  contains: "∋",
  not_empty: "≠ ∅",
  is_empty: "= ∅",
  greater_than: ">",
  less_than: "<",
};

const OPERATOR_FULL: Record<string, string> = {
  equals: "Equals",
  not_equals: "Does not equal",
  contains: "Contains",
  not_empty: "Is not empty",
  is_empty: "Is empty",
  greater_than: "Greater than",
  less_than: "Less than",
};

/* ── Main Component ───────────────────────────────────────── */

export default function ConditionalFlowCanvas({
  schema,
  onChange,
}: {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}) {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<RuleNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build all nodes and connections from the schema
  const { nodes, connections, sourceFields } = useMemo(() => {
    const nodes: RuleNode[] = [];
    const connections: Connection[] = [];
    const sourceFields: FieldDef[] = [];

    schema.steps.forEach((step, si) => {
      // Step-level node
      nodes.push({
        id: `step_${step.id}`,
        type: "step",
        label: step.title,
        stepIdx: si,
        condition: step.showCondition,
      });
      if (step.showCondition?.fieldId) {
        connections.push({
          sourceId: step.showCondition.fieldId,
          targetId: `step_${step.id}`,
          operator: step.showCondition.operator,
          value: step.showCondition.value,
        });
      }

      // Field-level nodes
      step.fields.forEach((field) => {
        // Track all usable source fields
        if (field.type !== "heading" && field.type !== "file" && field.type !== "files") {
          sourceFields.push(field);
        }
        if (field.showCondition?.fieldId) {
          nodes.push({
            id: field.id,
            type: "field",
            label: field.label,
            fieldType: field.type,
            stepIdx: si,
            condition: field.showCondition,
          });
          connections.push({
            sourceId: field.showCondition.fieldId,
            targetId: field.id,
            operator: field.showCondition.operator,
            value: field.showCondition.value,
          });
        }
      });
    });

    return { nodes: nodes.filter((n) => n.condition?.fieldId), connections, sourceFields };
  }, [schema]);

  // All fields flat for lookups
  const allFieldsFlat = useMemo(() => {
    const flat: (FieldDef & { stepIdx: number })[] = [];
    schema.steps.forEach((step, si) => {
      step.fields.forEach((f) => flat.push({ ...f, stepIdx: si }));
    });
    return flat;
  }, [schema]);

  const fieldById = useCallback(
    (id: string) => allFieldsFlat.find((f) => f.id === id),
    [allFieldsFlat],
  );

  // Group connections by source field
  const connectionsBySource = useMemo(() => {
    const map: Record<string, Connection[]> = {};
    connections.forEach((c) => {
      (map[c.sourceId] ||= []).push(c);
    });
    return map;
  }, [connections]);

  // Unique source fields that have rules pointing to them
  const activeSourceIds = useMemo(
    () => [...new Set(connections.map((c) => c.sourceId))],
    [connections],
  );

  function handleRemoveCondition(targetId: string, targetType: "field" | "step") {
    const updated = JSON.parse(JSON.stringify(schema)) as FormSchema;
    if (targetType === "step") {
      const stepId = targetId.replace("step_", "");
      const step = updated.steps.find((s) => s.id === stepId);
      if (step) delete step.showCondition;
    } else {
      for (const step of updated.steps) {
        const field = step.fields.find((f) => f.id === targetId);
        if (field) {
          delete field.showCondition;
          break;
        }
      }
    }
    onChange(updated);
    setSelectedRule(null);
  }

  function handleUpdateCondition(targetId: string, targetType: "field" | "step", condition: ShowCondition) {
    const updated = JSON.parse(JSON.stringify(schema)) as FormSchema;
    if (targetType === "step") {
      const stepId = targetId.replace("step_", "");
      const step = updated.steps.find((s) => s.id === stepId);
      if (step) step.showCondition = condition;
    } else {
      for (const step of updated.steps) {
        const field = step.fields.find((f) => f.id === targetId);
        if (field) {
          field.showCondition = condition;
          break;
        }
      }
    }
    onChange(updated);
  }

  function handleAddRule(targetId: string, targetType: "field" | "step") {
    if (sourceFields.length === 0) return;
    const condition: ShowCondition = {
      fieldId: sourceFields[0].id,
      operator: "equals",
      value: "",
    };
    handleUpdateCondition(targetId, targetType, condition);
  }

  // Steps and fields available as targets (no condition yet)
  const availableTargets = useMemo(() => {
    const targets: { id: string; type: "field" | "step"; label: string; stepIdx: number }[] = [];
    schema.steps.forEach((step, si) => {
      if (!step.showCondition?.fieldId) {
        targets.push({ id: `step_${step.id}`, type: "step", label: `Step: ${step.title}`, stepIdx: si });
      }
      step.fields.forEach((f) => {
        if (!f.showCondition?.fieldId && f.type !== "heading") {
          targets.push({ id: f.id, type: "field", label: f.label, stepIdx: si });
        }
      });
    });
    return targets;
  }, [schema]);

  // Color palette for source fields
  const sourceColors = useMemo(() => {
    const palette = [
      "#696cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa",
      "#a78bfa", "#fb923c", "#2dd4bf", "#e879f9", "#4ade80",
    ];
    const map: Record<string, string> = {};
    activeSourceIds.forEach((id, i) => {
      map[id] = palette[i % palette.length];
    });
    return map;
  }, [activeSourceIds]);

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Top bar */}
      <div className="shrink-0 px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface tracking-tight">
              <i className="fa-solid fa-diagram-project text-primary mr-2" />
              Smart Conditions
            </h2>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">
              Visual logic — fields and steps appear or hide based on user answers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">
              {connections.length} rule{connections.length !== 1 ? "s" : ""} active
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Flow canvas area */}
        <div className="flex-1 overflow-auto p-6">
          {connections.length === 0 && availableTargets.length > 0 ? (
            <EmptyState
              availableTargets={availableTargets}
              sourceFields={sourceFields}
              onAddRule={handleAddRule}
              fieldById={fieldById}
            />
          ) : (
            <div className="space-y-6">
              {/* Active rules grouped by source */}
              {activeSourceIds.map((sourceId) => {
                const source = fieldById(sourceId);
                if (!source) return null;
                const conns = connectionsBySource[sourceId] ?? [];
                const color = sourceColors[sourceId] ?? "#696cf8";

                return (
                  <div key={sourceId} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
                    {/* Source field header */}
                    <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-3" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px]" style={{ backgroundColor: color + "18", color }}>
                        <i className="fa-solid fa-bolt" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{source.label}</p>
                        <p className="text-[10px] text-on-surface-variant/60">
                          Trigger field &middot; Step {source.stepIdx + 1}
                        </p>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "15", color }}>
                        {conns.length} target{conns.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Connection lines */}
                    <div className="p-4 space-y-2">
                      {conns.map((conn) => {
                        const target = nodes.find((n) => n.id === conn.targetId);
                        if (!target) return null;
                        const isSelected = selectedRule === conn.targetId;

                        return (
                          <div
                            key={conn.targetId}
                            onClick={() => setSelectedRule(isSelected ? null : conn.targetId)}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary/5 border-2 border-primary/30 shadow-sm"
                                : "bg-surface-container hover:bg-surface-container-high/60 border-2 border-transparent"
                            }`}
                          >
                            {/* Condition badge */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md" style={{ backgroundColor: color + "15", color }}>
                                {OPERATOR_LABELS[conn.operator] ?? conn.operator}
                              </span>
                              {conn.value && (
                                <span className="text-[10px] font-medium text-on-surface bg-surface-container-high px-2 py-1 rounded-md max-w-[120px] truncate">
                                  {conn.value}
                                </span>
                              )}
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center gap-1 text-on-surface-variant/30">
                              <div className="w-6 h-px" style={{ backgroundColor: color + "40" }} />
                              <i className="fa-solid fa-chevron-right text-[7px]" style={{ color: color + "60" }} />
                            </div>

                            {/* Target */}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] ${
                                target.type === "step"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                <i className={`fa-solid ${target.type === "step" ? "fa-layer-group" : "fa-eye"}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-on-surface truncate">{target.label}</p>
                                <p className="text-[9px] text-on-surface-variant/50">
                                  {target.type === "step" ? "Entire step" : `Field in step ${target.stepIdx + 1}`}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTarget(target);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-all"
                                title="Edit rule"
                              >
                                <i className="fa-solid fa-pen text-[9px]" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCondition(conn.targetId, target.type);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-all"
                                title="Remove rule"
                              >
                                <i className="fa-solid fa-trash text-[9px]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Add new rule */}
              {availableTargets.length > 0 && (
                <AddRuleCard
                  availableTargets={availableTargets}
                  sourceFields={sourceFields}
                  onAddRule={(targetId, targetType, condition) => {
                    handleUpdateCondition(targetId, targetType, condition);
                  }}
                  fieldById={fieldById}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: summary sidebar */}
        <div className="w-72 shrink-0 border-l border-outline-variant/10 bg-surface-container-low/20 overflow-y-auto hidden lg:block">
          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Form Structure</h3>
              <div className="space-y-2">
                {schema.steps.map((step, si) => (
                  <div key={step.id} className="rounded-xl bg-surface-container p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">{si + 1}</span>
                      <span className="text-xs font-semibold text-on-surface truncate flex-1">{step.title}</span>
                      {step.showCondition?.fieldId && (
                        <i className="fa-solid fa-eye text-[8px] text-amber-400" title="Has condition" />
                      )}
                    </div>
                    <div className="space-y-0.5 ml-7">
                      {step.fields.map((f) => (
                        <div key={f.id} className="flex items-center gap-1.5 text-[10px] text-on-surface-variant/70">
                          {f.showCondition?.fieldId ? (
                            <i className="fa-solid fa-eye text-[7px] text-amber-400" />
                          ) : (
                            <i className="fa-solid fa-circle text-[4px] text-on-surface-variant/30" />
                          )}
                          <span className="truncate">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant/10 pt-4">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">How it works</h3>
              <div className="space-y-2.5 text-[11px] text-on-surface-variant/60 leading-relaxed">
                <p>
                  <i className="fa-solid fa-bolt text-primary text-[9px] mr-1.5" />
                  <strong className="text-on-surface-variant/80">Trigger fields</strong> are the questions your client answers.
                </p>
                <p>
                  <i className="fa-solid fa-eye text-amber-400 text-[9px] mr-1.5" />
                  <strong className="text-on-surface-variant/80">Targets</strong> are the fields or steps that show/hide based on the answer.
                </p>
                <p>
                  <i className="fa-solid fa-forward text-tertiary text-[9px] mr-1.5" />
                  <strong className="text-on-surface-variant/80">Hidden steps</strong> are auto-skipped during navigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingTarget && (
        <EditRuleModal
          target={editingTarget}
          sourceFields={sourceFields}
          condition={editingTarget.condition!}
          onSave={(condition) => {
            handleUpdateCondition(editingTarget.id, editingTarget.type, condition);
            setEditingTarget(null);
          }}
          onClose={() => setEditingTarget(null)}
          fieldById={fieldById}
        />
      )}
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────── */

function EmptyState({
  availableTargets,
  sourceFields,
  onAddRule,
  fieldById,
}: {
  availableTargets: { id: string; type: "field" | "step"; label: string; stepIdx: number }[];
  sourceFields: FieldDef[];
  onAddRule: (targetId: string, targetType: "field" | "step") => void;
  fieldById: (id: string) => (FieldDef & { stepIdx: number }) | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <i className="fa-solid fa-diagram-project text-3xl text-primary" />
      </div>
      <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
        No conditional logic yet
      </h3>
      <p className="text-sm text-on-surface-variant/60 mb-8 leading-relaxed">
        Make your form smart — show or hide fields and entire steps based on how your client answers.
        For example: &ldquo;What services do you need?&rdquo; → selecting &ldquo;SEO&rdquo; reveals the SEO-specific step.
      </p>

      <AddRuleCard
        availableTargets={availableTargets}
        sourceFields={sourceFields}
        onAddRule={(targetId, targetType, condition) => {
          // Find in schema and update
          onAddRule(targetId, targetType);
        }}
        fieldById={fieldById}
        isFirst
      />
    </div>
  );
}

/* ── Add Rule Card ────────────────────────────────────────── */

function AddRuleCard({
  availableTargets,
  sourceFields,
  onAddRule,
  fieldById,
  isFirst,
}: {
  availableTargets: { id: string; type: "field" | "step"; label: string; stepIdx: number }[];
  sourceFields: FieldDef[];
  onAddRule: (targetId: string, targetType: "field" | "step", condition: ShowCondition) => void;
  fieldById: (id: string) => (FieldDef & { stepIdx: number }) | undefined;
  isFirst?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [operator, setOperator] = useState<ShowCondition["operator"]>("equals");
  const [value, setValue] = useState("");
  const [targetId, setTargetId] = useState("");

  const selectedSource = sourceId ? sourceFields.find((f) => f.id === sourceId) : null;
  const hasOptions = selectedSource && ["select", "radio", "checkbox"].includes(selectedSource.type);
  const needsValue = operator !== "not_empty" && operator !== "is_empty";

  const selectedTarget = targetId ? availableTargets.find((t) => t.id === targetId) : null;

  function handleCreate() {
    if (!sourceId || !targetId || !selectedTarget) return;
    const condition: ShowCondition = { fieldId: sourceId, operator, value: needsValue ? value : undefined };
    onAddRule(targetId, selectedTarget.type, condition);
    setOpen(false);
    setSourceId("");
    setOperator("equals");
    setValue("");
    setTargetId("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all ${isFirst ? "py-5" : ""}`}
      >
        <i className="fa-solid fa-plus text-xs" />
        Add Conditional Rule
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-on-surface">
          <i className="fa-solid fa-plus text-primary text-xs mr-2" />
          New Conditional Rule
        </h4>
        <button onClick={() => setOpen(false)} className="text-on-surface-variant/60 hover:text-on-surface"><i className="fa-solid fa-xmark" /></button>
      </div>

      {/* Step 1: trigger field */}
      <div>
        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-bold mr-1.5">1</span>
          When this field...
        </label>
        <select
          value={sourceId}
          onChange={(e) => { setSourceId(e.target.value); setValue(""); }}
          className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
        >
          <option value="">Select a trigger field...</option>
          {sourceFields.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Step 2: operator + value */}
      {sourceId && (
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-bold mr-1.5">2</span>
            Matches this condition...
          </label>
          <div className="flex gap-2">
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as ShowCondition["operator"])}
              className="flex-1 px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
            >
              {Object.entries(OPERATOR_FULL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {needsValue && (
              hasOptions ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
                >
                  <option value="">Select value...</option>
                  {(selectedSource!.options ?? []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value..."
                  className="flex-1 px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none"
                />
              )
            )}
          </div>
        </div>
      )}

      {/* Step 3: target */}
      {sourceId && (
        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-bold mr-1.5">3</span>
            Then show...
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
          >
            <option value="">Select a field or step to show...</option>
            <optgroup label="Steps">
              {availableTargets.filter((t) => t.type === "step").map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Fields">
              {availableTargets.filter((t) => t.type === "field").map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!sourceId || !targetId || (needsValue && !value)}
        className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-primary/20"
      >
        <i className="fa-solid fa-check text-xs mr-2" />
        Create Rule
      </button>
    </div>
  );
}

/* ── Edit Rule Modal ──────────────────────────────────────── */

function EditRuleModal({
  target,
  sourceFields,
  condition,
  onSave,
  onClose,
  fieldById,
}: {
  target: RuleNode;
  sourceFields: FieldDef[];
  condition: ShowCondition;
  onSave: (c: ShowCondition) => void;
  onClose: () => void;
  fieldById: (id: string) => (FieldDef & { stepIdx: number }) | undefined;
}) {
  const [sourceId, setSourceId] = useState(condition.fieldId);
  const [operator, setOperator] = useState(condition.operator);
  const [value, setValue] = useState(condition.value ?? "");

  const selectedSource = sourceId ? sourceFields.find((f) => f.id === sourceId) : null;
  const hasOptions = selectedSource && ["select", "radio", "checkbox"].includes(selectedSource.type);
  const needsValue = operator !== "not_empty" && operator !== "is_empty";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container rounded-2xl border border-outline-variant/15 p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface">
            <i className="fa-solid fa-pen text-primary text-xs mr-2" />
            Edit Rule for &ldquo;{target.label}&rdquo;
          </h3>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface"><i className="fa-solid fa-xmark" /></button>
        </div>

        <div>
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Trigger field</label>
          <select
            value={sourceId}
            onChange={(e) => { setSourceId(e.target.value); setValue(""); }}
            className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
          >
            {sourceFields.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as ShowCondition["operator"])}
              className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none"
            >
              {Object.entries(OPERATOR_FULL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {needsValue && (
            <div className="flex-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Value</label>
              {hasOptions ? (
                <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface focus:ring-1 focus:ring-primary/40 outline-none">
                  <option value="">Select...</option>
                  {(selectedSource!.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value..." className="w-full px-4 py-2.5 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none" />
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onSave({ fieldId: sourceId, operator, value: needsValue ? value : undefined })}
          disabled={!sourceId || (needsValue && !value)}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm disabled:opacity-40 transition-all"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}
