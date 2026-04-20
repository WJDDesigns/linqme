import { createAdminClient } from "@/lib/supabase/admin";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  submissionsMonthlyLimit: number | null;
  formsLimit: number | null;
  features: string[];
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  highlight: boolean;
  sortOrder: number;
}

/**
 * Fetch all active plans from the database, sorted by sort_order.
 * Falls back to hardcoded defaults if the plans table doesn't exist yet.
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return getDefaultPlans();
    }

    return data.map(mapDbPlan);
  } catch {
    return getDefaultPlans();
  }
}

/**
 * Fetch ALL plans (including inactive) for admin management.
 */
export async function getAllPlans(): Promise<Plan[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return getDefaultPlans();
  return data.map(mapDbPlan);
}

/**
 * Get a single plan by slug.
 * Falls back to hardcoded defaults if the plans table is empty or missing.
 */
/** Map legacy plan slugs to current ones */
function normalizePlanSlug(slug: string): string {
  switch (slug) {
    case "standard": return "starter";
    case "enterprise": return "agency";
    default: return slug;
  }
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const normalized = normalizePlanSlug(slug);

  try {
    const admin = createAdminClient();
    // Try the normalized slug first, then fall back to original
    const { data } = await admin
      .from("plans")
      .select("*")
      .eq("slug", normalized)
      .maybeSingle();

    if (data) return mapDbPlan(data);

    // Try original slug in case DB still uses old names
    if (normalized !== slug) {
      const { data: legacy } = await admin
        .from("plans")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (legacy) return mapDbPlan(legacy);
    }
  } catch {
    // DB unavailable — fall through to defaults
  }

  // Fallback: search hardcoded defaults
  return getDefaultPlans().find((p) => p.slug === normalized) ?? getDefaultPlans().find((p) => p.slug === slug) ?? null;
}

/** Fallback Stripe price IDs from env vars when DB doesn't have them */
function fallbackStripePriceId(slug: string): string | null {
  switch (slug) {
    case "starter":
    case "standard":
      return process.env.STRIPE_PRICE_STARTER ?? null;
    case "pro":
      return process.env.STRIPE_PRICE_PRO ?? null;
    case "agency":
    case "enterprise":
      return process.env.STRIPE_PRICE_AGENCY ?? null;
    default:
      return null;
  }
}

function mapDbPlan(row: Record<string, unknown>): Plan {
  const slug = row.slug as string;
  return {
    id: row.id as string,
    slug,
    name: row.name as string,
    priceMonthly: row.price_monthly as number,
    submissionsMonthlyLimit: row.submissions_monthly_limit as number | null,
    formsLimit: (row.forms_limit as number | null) ?? null,
    features: (row.features as string[]) ?? [],
    stripeProductId: row.stripe_product_id as string | null,
    stripePriceId: (row.stripe_price_id as string | null) ?? fallbackStripePriceId(slug),
    isActive: row.is_active as boolean,
    highlight: row.highlight as boolean,
    sortOrder: row.sort_order as number,
  };
}

/**
 * Get the form limit for a given plan tier.
 * Returns null for unlimited.
 */
export function getFormsLimitForTier(tier: string): number | null {
  switch (tier) {
    case "free": return 1;
    case "starter":
    case "standard":
    case "paid": return 5;
    case "pro":
    case "unlimited": return null;
    case "enterprise":
    case "agency": return null;
    default: return 1;
  }
}

function getDefaultPlans(): Plan[] {
  return [
    {
      id: "default-free",
      slug: "free",
      name: "Free",
      priceMonthly: 0,
      submissionsMonthlyLimit: 10,
      features: ["Your own branded workspace", "1 form", "Unlimited form fields", "File uploads", "100 MB storage", "10 submissions / month"],
      formsLimit: 1,
      stripeProductId: null,
      stripePriceId: null,
      isActive: true,
      highlight: false,
      sortOrder: 0,
    },
    {
      id: "default-starter",
      slug: "starter",
      name: "Starter",
      priceMonthly: 3900,
      submissionsMonthlyLimit: 50,
      formsLimit: 5,
      features: ["Everything in Free", "Up to 5 forms", "50 submissions / month", "1 GB storage", "CSV & PDF exports", "Email support"],
      stripeProductId: null,
      stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
      isActive: true,
      highlight: false,
      sortOrder: 1,
    },
    {
      id: "default-pro",
      slug: "pro",
      name: "Pro",
      priceMonthly: 9900,
      submissionsMonthlyLimit: null,
      formsLimit: null,
      features: ["Everything in Starter", "Unlimited forms", "Unlimited submissions", "100 GB storage", "Full white-labeling", "Custom domain"],
      stripeProductId: null,
      stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
      isActive: true,
      highlight: true,
      sortOrder: 2,
    },
    {
      id: "default-agency",
      slug: "agency",
      name: "Agency",
      priceMonthly: 24900,
      submissionsMonthlyLimit: null,
      formsLimit: null,
      features: ["Everything in Pro", "Partner management", "500 GB storage", "Priority 24/7 support", "SLA guarantee"],
      stripeProductId: null,
      stripePriceId: process.env.STRIPE_PRICE_AGENCY ?? null,
      isActive: true,
      highlight: false,
      sortOrder: 3,
    },
  ];
}
