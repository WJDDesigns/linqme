// Form schema types shared between server and client components.

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "color"
  | "heading"
  | "address"
  | "file"
  | "files"
  | "package"
  | "repeater"
  | "consent"
  | "asset_collection"
  | "site_structure"
  | "feature_selector"
  | "goal_builder"
  | "approval";

/* ââ Package Selector types âââââââââââââââââââââââââââââââ */

export interface PackageFeature {
  /** Feature label shown in the grid, e.g. "Custom Domain" */
  label: string;
  /** Value per package keyed by package id â true/false for checkmarks, or a string for text */
  values: Record<string, boolean | string>;
}

export interface PackageOption {
  id: string;
  name: string;
  /** Monthly price in dollars (0 for free) */
  price: number;
  /** Short tagline, e.g. "Best for small teams" */
  description?: string;
  /** Longer paragraph description for the package */
  longDescription?: string;
  /** Highlight / badge text, e.g. "Most Popular" */
  badge?: string;
  /** Feature bullet points shown as a checkmark list */
  featureList?: string[];
  /** Hide the price on this package (e.g. for "Custom" packages) */
  hidePrice?: boolean;
  /** Custom label shown instead of price when hidePrice is true, e.g. "Custom" or "Contact Us" */
  priceLabel?: string;
}

/** A rule that recommends a package based on a prior answer */
export interface PackageRule {
  /** Field ID from a previous step to evaluate */
  fieldId: string;
  /** Operator for comparison */
  operator: "equals" | "contains" | "greater_than" | "less_than";
  /** Value to compare against */
  value: string;
  /** Package ID to recommend when this rule matches */
  recommendedPackageId: string;
}

/** Display style for the package selector */
export type PackageLayout = "cards" | "horizontal" | "compact" | "list";

export interface PackageConfig {
  packages: PackageOption[];
  features: PackageFeature[];
  rules: PackageRule[];
  /** Default package ID to recommend if no rules match */
  defaultPackageId?: string;
  /** Display layout style (default "cards") */
  layout?: PackageLayout;
  /** Number of grid columns: 1-4, or "auto" to fit based on count (default "auto") */
  columns?: 1 | 2 | 3 | 4 | "auto";
  /** Show the comparison features table below the cards */
  showFeaturesTable?: boolean;
}

/* ââ Repeater (nested entries) types ââââââââââââââââââââââ */

/** A sub-field inside a repeater entry */
export interface RepeaterSubField {
  id: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "file" | "files" | "email" | "tel" | "url" | "number" | "date";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  hint?: string;
  accept?: string;
  /** Show this sub-field only when another sub-field matches a value */
  showWhen?: {
    /** ID of the sub-field to check */
    fieldId: string;
    /** Show when that field equals one of these values */
    values: string[];
  };
}

export interface RepeaterConfig {
  subFields: RepeaterSubField[];
  /** Minimum entries required (default 0) */
  minEntries?: number;
  /** Maximum entries allowed (default unlimited) */
  maxEntries?: number;
  /** Label for the "Add" button, e.g. "Add Page" */
  addButtonLabel?: string;
  /** Singular noun for each entry, e.g. "Page" */
  entryLabel?: string;
  /** Column headers shown in the summary table */
  summaryFields?: string[];
}

/* ââ Asset Collection types ââââââââââââââââââââââââââââââââââ */

export type AssetCategory = "logos" | "colors" | "fonts" | "documents" | "images" | "other";

export interface AssetCollectionConfig {
  /** Which asset categories to show (default all) */
  categories?: AssetCategory[];
  /** Max total files allowed */
  maxFiles?: number;
  /** Allow connecting cloud storage (Google Drive, Dropbox) */
  allowCloudConnect?: boolean;
}

/* ââ Site Structure Builder types ââââââââââââââââââââââââââââ */

export interface SiteStructurePage {
  id: string;
  name: string;
  /** Nested children for sub-pages */
  children?: SiteStructurePage[];
}

export interface SiteStructureConfig {
  /** Pre-populated starter pages */
  starterPages?: SiteStructurePage[];
  /** Max pages allowed */
  maxPages?: number;
  /** Allow nesting / sub-pages */
  allowNesting?: boolean;
}

/* ââ Feature Selector types âââââââââââââââââââââââââââââââââ */

export interface FeatureOption {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  /** Complexity label (e.g. "Simple", "Medium", "Complex") */
  complexity?: string;
  /** Price impact string (e.g. "+$500", "Included") */
  priceImpact?: string;
  /** Category grouping */
  category?: string;
}

export interface FeatureSelectorConfig {
  features: FeatureOption[];
  /** Max features a client can select (0 = unlimited) */
  maxSelections?: number;
  /** Show price/complexity indicators */
  showPriceImpact?: boolean;
  showComplexity?: boolean;
}

/* ââ Goal Builder types âââââââââââââââââââââââââââââââââââââ */

export interface GoalOption {
  id: string;
  label: string;
  icon?: string;
  /** Refinement questions shown when this goal is selected */
  refinements?: GoalRefinement[];
}

export interface GoalRefinement {
  id: string;
  label: string;
  type: "select" | "number" | "text" | "range";
  options?: string[];
  placeholder?: string;
  /** For range type */
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export interface GoalBuilderConfig {
  goals: GoalOption[];
  /** Allow selecting multiple primary goals */
  allowMultiple?: boolean;
}

/* ââ Approval / Sign-off types ââââââââââââââââââââââââââââââ */

export interface ApprovalConfig {
  /** Text/scope to approve (HTML or plain text) */
  scopeText?: string;
  /** Require a typed signature */
  requireSignature?: boolean;
  /** Require typing full name to confirm */
  requireFullName?: boolean;
  /** Custom approval button label */
  approveLabel?: string;
}

/** Condition to show/hide a field or step based on another field's value */
export interface ShowCondition {
  /** ID of the field to evaluate (from any step) */
  fieldId: string;
  /** Comparison operator */
  operator: "equals" | "not_equals" | "contains" | "not_empty" | "is_empty";
  /** Value to compare against (not used for not_empty / is_empty) */
  value?: string;
}

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  rows?: number;
  accept?: string;
  hint?: string;
  /** For heading fields â rich text / description content */
  content?: string;
  /** For checkbox fields â max selections allowed */
  maxSelections?: number;
  /** For package fields â full package configuration */
  packageConfig?: PackageConfig;
  /** For repeater fields â sub-fields and entry config */
  repeaterConfig?: RepeaterConfig;
  /** For consent fields â the scrollable agreement text (plain text or HTML) */
  consentText?: string;
  /** For consent fields â label next to the checkbox, e.g. "I agree to the terms above" */
  consentCheckboxLabel?: string;
  /** For asset_collection fields â asset upload configuration */
  assetCollectionConfig?: AssetCollectionConfig;
  /** For site_structure fields â sitemap builder configuration */
  siteStructureConfig?: SiteStructureConfig;
  /** For feature_selector fields â feature toggle configuration */
  featureSelectorConfig?: FeatureSelectorConfig;
  /** For goal_builder fields â goal picker configuration */
  goalBuilderConfig?: GoalBuilderConfig;
  /** For approval fields â sign-off configuration */
  approvalConfig?: ApprovalConfig;
  /** Show this field only when the condition is met */
  showCondition?: ShowCondition;
  /** For file/files fields: optional cloud storage destination */
  cloudDestination?: {
    provider: "google_drive" | "dropbox" | "onedrive" | "box";
    folderId: string;
    folderPath: string;
  };
}

export interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
}

export interface StepDef {
  id: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  /** Show this step/page only when the condition is met */
  showCondition?: ShowCondition;
}

export interface FormSchema {
  steps: StepDef[];
}

/**
 * Evaluate a show condition against the current form data.
 * Returns true if the field/step should be visible.
 */
export function evaluateCondition(
  condition: ShowCondition | undefined,
  allData: Record<string, unknown>,
): boolean {
  if (!condition || !condition.fieldId) return true;

  const raw = allData[condition.fieldId];
  const fieldVal = raw === undefined || raw === null ? "" : String(raw);

  switch (condition.operator) {
    case "equals":
      return fieldVal === (condition.value ?? "");
    case "not_equals":
      return fieldVal !== (condition.value ?? "");
    case "contains":
      return fieldVal.toLowerCase().includes((condition.value ?? "").toLowerCase());
    case "not_empty":
      return fieldVal.trim() !== "";
    case "is_empty":
      return fieldVal.trim() === "";
    default:
      return true;
  }
}

export function mergeSchema(base: FormSchema, overrides: Record<string, unknown>): FormSchema {
  // Phase 2a: overrides are a no-op. Phase 2b will merge per-field label/visibility tweaks.
  void overrides;
  return base;
}

export function validateStepData(
  step: StepDef,
  data: Record<string, unknown>,
  /** All form data across steps, used to evaluate field-level conditions */
  allData?: Record<string, unknown>,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  for (const f of step.fields) {
    // Skip hidden fields â they should not be validated
    if (f.showCondition && !evaluateCondition(f.showCondition, allData ?? data)) continue;
    // File fields are validated separately (upload state lives in submission_files).
    if (f.type === "file" || f.type === "files") continue;
    // Heading fields are display-only, never validated.
    if (f.type === "heading") continue;
    const v = data[f.id];
    // Repeater entries are validated inline â the component handles required sub-fields.
    if (f.type === "repeater") {
      if (f.required && f.repeaterConfig?.minEntries) {
        try {
          const entries = typeof v === "string" ? JSON.parse(v || "[]") : (Array.isArray(v) ? v : []);
          if (entries.length < f.repeaterConfig.minEntries) {
            errors[f.id] = `At least ${f.repeaterConfig.minEntries} ${f.repeaterConfig.entryLabel?.toLowerCase() || "entry"}(s) required`;
          }
        } catch { /* malformed JSON â let it pass */ }
      }
      continue;
    }
    // Package fields store selected package id â validated as required if set.
    if (f.type === "package") {
      if (f.required && (!v || v === "")) errors[f.id] = "Please select a package";
      continue;
    }
    // Consent fields must be checked ("yes") when required.
    if (f.type === "consent") {
      if (f.required && v !== "yes") errors[f.id] = "You must agree to continue";
      continue;
    }
    if (f.required) {
      if (v === undefined || v === null || v === "") {
        errors[f.id] = "Required";
        continue;
      }
    }
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "email" && typeof v === "string") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errors[f.id] = "Invalid email";
    }
    if (f.type === "url" && typeof v === "string") {
      try {
        new URL(v);
      } catch {
        errors[f.id] = "Invalid URL";
      }
    }
    if (f.type === "number" && typeof v === "string") {
      if (Number.isNaN(Number(v))) errors[f.id] = "Must be a number";
    }
    if (f.type === "color" && typeof v === "string") {
      if (!/^#[0-9a-f]{3,8}$/i.test(v)) errors[f.id] = "Invalid hex color";
    }
    if (f.type === "date" && typeof v === "string") {
      if (Number.isNaN(Date.parse(v))) errors[f.id] = "Invalid date";
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}
