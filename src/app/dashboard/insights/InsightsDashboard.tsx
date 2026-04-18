"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { saveDashboardWidgets } from "./actions";
import type { Widget, WidgetType, ChartType, WidgetSize, WidgetOrientation, AggregateFunction, InsightDashboard } from "./actions";

/* ── Constants ────────────────────────────────────────────── */

const CHART_COLORS = [
  "var(--color-primary-rgb, 105 108 248)",
  "34 197 94", "251 146 60", "168 85 247",
  "236 72 153", "14 165 233", "234 179 8", "239 68 68",
];

function rgb(c: string) { return `rgb(${c})`; }

const SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-2 row-span-1",
  lg: "col-span-2 row-span-2",
  xl: "col-span-3 row-span-2",
};

const SIZE_LABELS: Record<WidgetSize, string> = {
  sm: "Small (1×1)",
  md: "Medium (2×1)",
  lg: "Large (2×2)",
  xl: "Extra Large (3×2)",
};

const ORIENTATION_LABELS: Record<WidgetOrientation, string> = {
  landscape: "Landscape",
  portrait: "Portrait",
};

const TYPE_ICONS: Record<WidgetType, string> = {
  number: "fa-hashtag",
  chart: "fa-chart-bar",
  table: "fa-table",
};

const CHART_ICONS: Record<ChartType, string> = {
  bar: "fa-chart-bar",
  line: "fa-chart-line",
  area: "fa-chart-area",
  pie: "fa-chart-pie",
  donut: "fa-circle-notch",
  radar: "fa-diagram-project",
};

const AGGREGATE_LABELS: Record<AggregateFunction, string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
  unique: "Unique values",
};

/** Built-in "virtual" fields that every form has */
const SYSTEM_FIELDS = [
  { key: "__count", label: "Submission Count", type: "number" },
  { key: "__status", label: "Status", type: "select" },
  { key: "__client_name", label: "Client Name", type: "text" },
  { key: "__client_email", label: "Client Email", type: "email" },
  { key: "__created_at", label: "Created Date", type: "date" },
  { key: "__submitted_at", label: "Submitted Date", type: "date" },
];

/* ── Props ────────────────────────────────────────────────── */

interface Props {
  dashboard: InsightDashboard | null;
  forms: { id: string; name: string; slug: string }[];
  fieldMap: Record<string, { key: string; label: string; type: string }[]>;
  submissions: Record<string, unknown>[];
}

/* ── Component ────────────────────────────────────────────── */

export default function InsightsDashboard({ dashboard, forms, fieldMap, submissions }: Props) {
  const [widgets, setWidgets] = useState<Widget[]>(dashboard?.widgets ?? []);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Auto-save handler
  const save = useCallback((updated: Widget[]) => {
    startTransition(async () => {
      await saveDashboardWidgets(updated);
      setHasUnsaved(false);
    });
  }, []);

  const updateWidgets = useCallback((updated: Widget[]) => {
    setWidgets(updated);
    setHasUnsaved(true);
  }, []);

  // Compute data for each widget from submissions
  const widgetData = useMemo(() => {
    const results: Record<string, unknown> = {};
    for (const widget of widgets) {
      const ds = widget.dataSource;
      let filtered = submissions;

      if (ds.formId) {
        filtered = filtered.filter((s) => s.partner_form_id === ds.formId);
      }
      if (ds.statusFilter && ds.statusFilter.length > 0) {
        filtered = filtered.filter((s) => ds.statusFilter!.includes(s.status as string));
      }
      if (ds.timeRangeDays > 0) {
        const cutoff = new Date(Date.now() - ds.timeRangeDays * 86400000).toISOString();
        filtered = filtered.filter((s) => (s.created_at as string) >= cutoff);
      }

      const values: unknown[] = [];
      for (const sub of filtered) {
        const data = (sub.data ?? {}) as Record<string, unknown>;
        if (ds.fieldKey === "__count") values.push(1);
        else if (ds.fieldKey.startsWith("__")) values.push(sub[ds.fieldKey.replace("__", "")]);
        else values.push(data[ds.fieldKey] ?? null);
      }

      if (widget.type === "number") {
        results[widget.id] = computeAggregate(values, ds.aggregate);
      } else if (widget.type === "chart") {
        const groupValues: unknown[] = [];
        if (ds.groupByField) {
          for (const sub of filtered) {
            const data = (sub.data ?? {}) as Record<string, unknown>;
            if (ds.groupByField === "__status") groupValues.push(sub.status);
            else if (ds.groupByField === "__created_at") groupValues.push((sub.created_at as string)?.slice(0, 10));
            else if (ds.groupByField === "__submitted_at") groupValues.push((sub.submitted_at as string)?.slice(0, 10));
            else groupValues.push(data[ds.groupByField] ?? "Unknown");
          }
        } else {
          for (const v of values) groupValues.push(v ?? "Unknown");
        }
        results[widget.id] = groupByValues(values, groupValues, ds.aggregate);
      } else if (widget.type === "table") {
        results[widget.id] = filtered.slice(0, 50).map((sub) => {
          const data = (sub.data ?? {}) as Record<string, unknown>;
          return {
            client_name: sub.client_name ?? "—",
            client_email: sub.client_email ?? "—",
            status: sub.status,
            created_at: sub.created_at,
            value: ds.fieldKey.startsWith("__") ? sub[ds.fieldKey.replace("__", "")] : data[ds.fieldKey] ?? null,
          };
        });
      }
    }
    return results;
  }, [widgets, submissions]);

  // Drag & drop reorder
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const updated = [...widgets];
    const fromIdx = updated.findIndex((w) => w.id === dragId);
    const toIdx = updated.findIndex((w) => w.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    updated.forEach((w, i) => (w.order = i));
    updateWidgets(updated);
    setDragId(null);
  };

  const removeWidget = (id: string) => {
    const updated = widgets.filter((w) => w.id !== id);
    updated.forEach((w, i) => (w.order = i));
    updateWidgets(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-headline tracking-tight text-on-surface">
            <i className="fa-solid fa-lightbulb text-primary mr-3" />
            Insights
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Build your custom dashboard from entry data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsaved && (
            <button
              onClick={() => save(widgets)}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <i className={`fa-solid ${isPending ? "fa-spinner fa-spin" : "fa-floppy-disk"}`} />
              Save
            </button>
          )}
          <button
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/15 transition-colors"
          >
            <i className="fa-solid fa-plus" />
            Add Widget
          </button>
        </div>
      </div>

      {/* Empty state */}
      {widgets.length === 0 && !showAddPanel && (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant/20 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-chart-mixed text-2xl text-primary" />
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">No widgets yet</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Add charts, numbers, and tables to visualize your entry data. Widgets automatically pull data from your form submissions.
          </p>
          <button
            onClick={() => setShowAddPanel(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition"
          >
            <i className="fa-solid fa-plus" />
            Add Your First Widget
          </button>
        </div>
      )}

      {/* Widget Grid */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[200px]">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(widget.id)}
              className={`glass-panel rounded-2xl border border-outline-variant/15 p-4 flex flex-col overflow-hidden group
                ${SIZE_CLASSES[widget.size]}
                ${widget.orientation === "portrait" ? "row-span-2" : ""}
                ${dragId === widget.id ? "opacity-40 scale-95" : ""}
                transition-all duration-200`}
            >
              {/* Widget header */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="fa-solid fa-grip-vertical text-xs text-on-surface-variant/30 cursor-grab active:cursor-grabbing" />
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                    {widget.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingWidget(widget)}
                    className="w-6 h-6 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-on-surface-variant/50 hover:text-on-surface-variant"
                  >
                    <i className="fa-solid fa-pen text-[10px]" />
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="w-6 h-6 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-on-surface-variant/50 hover:text-red-400"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </div>
              </div>

              {/* Widget body */}
              <div className="flex-1 min-h-0">
                {widget.type === "number" && (
                  <NumberWidget value={widgetData[widget.id] as number} widget={widget} />
                )}
                {widget.type === "chart" && (
                  <ChartWidget data={(widgetData[widget.id] ?? []) as { name: string; value: number }[]} widget={widget} />
                )}
                {widget.type === "table" && (
                  <TableWidget data={(widgetData[widget.id] ?? []) as Record<string, unknown>[]} widget={widget} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Widget Panel */}
      {showAddPanel && (
        <AddWidgetPanel
          forms={forms}
          fieldMap={fieldMap}
          onAdd={(widget) => {
            const updated = [...widgets, { ...widget, order: widgets.length }];
            updateWidgets(updated);
            setShowAddPanel(false);
          }}
          onClose={() => setShowAddPanel(false)}
        />
      )}

      {/* Edit Widget Panel */}
      {editingWidget && (
        <AddWidgetPanel
          forms={forms}
          fieldMap={fieldMap}
          editing={editingWidget}
          onAdd={(updated) => {
            const newWidgets = widgets.map((w) => (w.id === updated.id ? updated : w));
            updateWidgets(newWidgets);
            setEditingWidget(null);
          }}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
}

/* ── Number Widget ────────────────────────────────────────── */

function NumberWidget({ value, widget }: { value: number; widget: Widget }) {
  const formatted = typeof value === "number"
    ? value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
    : "0";
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl sm:text-5xl font-extrabold font-headline text-on-surface">
          {formatted}
        </div>
        <div className="text-xs text-on-surface-variant/60 mt-1 uppercase tracking-wider">
          {widget.dataSource.fieldLabel}
        </div>
      </div>
    </div>
  );
}

/* ── Chart Widget ─────────────────────────────────────────── */

function ChartWidget({ data, widget }: { data: { name: string; value: number }[]; widget: Widget }) {
  const chartType = widget.chartType ?? "bar";
  const colors = CHART_COLORS.map(rgb);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm">
        No data
      </div>
    );
  }

  if (chartType === "pie" || chartType === "donut") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={chartType === "donut" ? "55%" : 0}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "rgb(var(--color-surface-container))", border: "1px solid rgba(var(--color-outline-variant), 0.15)", borderRadius: 12 }}
            labelStyle={{ color: "rgb(var(--color-on-surface))" }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "radar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(var(--color-outline-variant), 0.15)" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "rgba(var(--color-on-surface-variant), 0.6)", fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fill: "rgba(var(--color-on-surface-variant), 0.4)", fontSize: 9 }} />
          <Radar dataKey="value" fill={colors[0]} fillOpacity={0.3} stroke={colors[0]} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  const ChartComp = chartType === "line" ? LineChart : chartType === "area" ? AreaChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ChartComp data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-outline-variant), 0.1)" />
        <XAxis dataKey="name" tick={{ fill: "rgba(var(--color-on-surface-variant), 0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(var(--color-on-surface-variant), 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "rgb(var(--color-surface-container))", border: "1px solid rgba(var(--color-outline-variant), 0.15)", borderRadius: 12 }}
          labelStyle={{ color: "rgb(var(--color-on-surface))" }}
        />
        {chartType === "bar" && <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />}
        {chartType === "line" && <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0], r: 3 }} />}
        {chartType === "area" && <Area type="monotone" dataKey="value" fill={colors[0]} fillOpacity={0.2} stroke={colors[0]} strokeWidth={2} />}
      </ChartComp>
    </ResponsiveContainer>
  );
}

/* ── Table Widget ─────────────────────────────────────────── */

function TableWidget({ data, widget }: { data: Record<string, unknown>[]; widget: Widget }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant/10">
            <th className="text-left py-1.5 px-2 font-bold text-on-surface-variant/50 uppercase tracking-wider">Client</th>
            <th className="text-left py-1.5 px-2 font-bold text-on-surface-variant/50 uppercase tracking-wider">Status</th>
            <th className="text-left py-1.5 px-2 font-bold text-on-surface-variant/50 uppercase tracking-wider">{widget.dataSource.fieldLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-outline-variant/5 hover:bg-white/[0.02]">
              <td className="py-1.5 px-2 text-on-surface/80 truncate max-w-[120px]">{String(row.client_name ?? "—")}</td>
              <td className="py-1.5 px-2">
                <StatusBadge status={String(row.status ?? "")} />
              </td>
              <td className="py-1.5 px-2 text-on-surface/60 truncate max-w-[160px]">{formatValue(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: "bg-blue-500/10 text-blue-400",
    in_review: "bg-amber-500/10 text-amber-400",
    complete: "bg-emerald-500/10 text-emerald-400",
    draft: "bg-white/5 text-on-surface-variant/40",
    archived: "bg-white/5 text-on-surface-variant/30",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colors[status] ?? colors.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function formatValue(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "object") return JSON.stringify(val).slice(0, 60);
  return String(val);
}

/* ── Add/Edit Widget Panel ────────────────────────────────── */

interface AddWidgetPanelProps {
  forms: { id: string; name: string; slug: string }[];
  fieldMap: Record<string, { key: string; label: string; type: string }[]>;
  editing?: Widget;
  onAdd: (widget: Widget) => void;
  onClose: () => void;
}

function AddWidgetPanel({ forms, fieldMap, editing, onAdd, onClose }: AddWidgetPanelProps) {
  const [type, setType] = useState<WidgetType>(editing?.type ?? "number");
  const [chartType, setChartType] = useState<ChartType>(editing?.chartType ?? "bar");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [size, setSize] = useState<WidgetSize>(editing?.size ?? "md");
  const [orientation, setOrientation] = useState<WidgetOrientation>(editing?.orientation ?? "landscape");
  const [formId, setFormId] = useState<string>(editing?.dataSource.formId ?? "");
  const [fieldKey, setFieldKey] = useState(editing?.dataSource.fieldKey ?? "__count");
  const [aggregate, setAggregate] = useState<AggregateFunction>(editing?.dataSource.aggregate ?? "count");
  const [groupByField, setGroupByField] = useState(editing?.dataSource.groupByField ?? "");
  const [timeRange, setTimeRange] = useState(editing?.dataSource.timeRangeDays ?? 30);

  const availableFields = useMemo(() => {
    const formFields = formId ? (fieldMap[formId] ?? []) : [];
    return [...SYSTEM_FIELDS, ...formFields];
  }, [formId, fieldMap]);

  const selectedFieldLabel = availableFields.find((f) => f.key === fieldKey)?.label ?? fieldKey;
  const groupByLabel = availableFields.find((f) => f.key === groupByField)?.label ?? groupByField;

  const handleAdd = () => {
    const widget: Widget = {
      id: editing?.id ?? crypto.randomUUID(),
      type,
      chartType: type === "chart" ? chartType : undefined,
      title: title || `${AGGREGATE_LABELS[aggregate]} of ${selectedFieldLabel}`,
      size,
      orientation,
      dataSource: {
        formId: formId || null,
        fieldKey,
        fieldLabel: selectedFieldLabel,
        aggregate,
        groupByField: groupByField || undefined,
        groupByLabel: groupByLabel || undefined,
        timeRangeDays: timeRange,
      },
      order: editing?.order ?? 0,
    };
    onAdd(widget);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-outline-variant/15 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-headline text-on-surface">
            {editing ? "Edit Widget" : "Add Widget"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-on-surface-variant">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Widget type selector */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Widget Type</label>
          <div className="flex gap-2 mt-2">
            {(["number", "chart", "table"] as WidgetType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold capitalize transition-colors ${
                  type === t
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "border-outline-variant/10 text-on-surface-variant hover:bg-white/[0.03]"
                }`}
              >
                <i className={`fa-solid ${TYPE_ICONS[t]} mr-2`} />
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chart type (when type === chart) */}
        {type === "chart" && (
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Chart Style</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["bar", "line", "area", "pie", "donut", "radar"] as ChartType[]).map((ct) => (
                <button
                  key={ct}
                  onClick={() => setChartType(ct)}
                  className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-colors ${
                    chartType === ct
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "border-outline-variant/10 text-on-surface-variant hover:bg-white/[0.03]"
                  }`}
                >
                  <i className={`fa-solid ${CHART_ICONS[ct]} mr-1.5`} />
                  {ct}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-generated if empty"
            className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Data source — form filter */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Form</label>
          <select
            value={formId}
            onChange={(e) => { setFormId(e.target.value); setFieldKey("__count"); setGroupByField(""); }}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Forms</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Field */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Field</label>
          <select
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <optgroup label="System Fields">
              {SYSTEM_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </optgroup>
            {formId && fieldMap[formId] && (
              <optgroup label="Form Fields">
                {fieldMap[formId].map((f) => (
                  <option key={f.key} value={f.key}>{f.label} ({f.type})</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Aggregate */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aggregate</label>
          <select
            value={aggregate}
            onChange={(e) => setAggregate(e.target.value as AggregateFunction)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {Object.entries(AGGREGATE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        {/* Group by (for charts) */}
        {type === "chart" && (
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Group By</label>
            <select
              value={groupByField}
              onChange={(e) => setGroupByField(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Same as field</option>
              {SYSTEM_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
              {formId && fieldMap[formId]?.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Time range */}
        <div>
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
            <option value={0}>All time</option>
          </select>
        </div>

        {/* Size & Orientation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as WidgetSize)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {Object.entries(SIZE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Orientation</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as WidgetOrientation)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant/15 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {Object.entries(ORIENTATION_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {editing ? "Update" : "Add Widget"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Utility functions ────────────────────────────────────── */

function computeAggregate(values: unknown[], fn: AggregateFunction): number {
  const nonNull = values.filter((v) => v != null);
  switch (fn) {
    case "count": return nonNull.length;
    case "sum": {
      let t = 0;
      for (const v of nonNull) { const n = typeof v === "number" ? v : parseFloat(String(v)); if (!isNaN(n)) t += n; }
      return t;
    }
    case "avg": {
      let s = 0, c = 0;
      for (const v of nonNull) { const n = typeof v === "number" ? v : parseFloat(String(v)); if (!isNaN(n)) { s += n; c++; } }
      return c > 0 ? Math.round((s / c) * 100) / 100 : 0;
    }
    case "min": {
      let m = Infinity;
      for (const v of nonNull) { const n = typeof v === "number" ? v : parseFloat(String(v)); if (!isNaN(n) && n < m) m = n; }
      return m === Infinity ? 0 : m;
    }
    case "max": {
      let m = -Infinity;
      for (const v of nonNull) { const n = typeof v === "number" ? v : parseFloat(String(v)); if (!isNaN(n) && n > m) m = n; }
      return m === -Infinity ? 0 : m;
    }
    case "unique": return new Set(nonNull.map(String)).size;
    default: return nonNull.length;
  }
}

function groupByValues(
  values: unknown[],
  groupKeys: unknown[],
  aggregate: AggregateFunction,
): { name: string; value: number }[] {
  const groups: Record<string, unknown[]> = {};
  for (let i = 0; i < values.length; i++) {
    const key = String(groupKeys[i] ?? "Unknown");
    if (!groups[key]) groups[key] = [];
    groups[key].push(values[i]);
  }
  return Object.entries(groups)
    .map(([name, vals]) => ({ name, value: computeAggregate(vals, aggregate) }))
    .sort((a, b) => b.value - a.value);
}
