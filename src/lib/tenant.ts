/**
 * Tenant resolution utilities.
 *
 * A request can arrive three ways:
 *   1. Root domain:        linqme.io                       → marketing / landing
 *   2. App subdomain:      app.linqme.io                   → dashboards, login
 *   3. Partner subdomain:  {slug}.linqme.io                → partner-branded app
 *   4. Custom domain:      onboard.popmarketing.com        → partner-branded app
 */

export type TenantKind = "root" | "app" | "partner";

export interface TenantContext {
  kind: TenantKind;
  slug?: string;              // set when kind === "partner" (via subdomain)
  customDomain?: string;      // set when arrived via custom CNAME
}

export function resolveTenant(host: string, rootDomain: string): TenantContext {
  // Strip port for comparison
  const cleanHost = host.split(":")[0].toLowerCase();
  const cleanRoot = rootDomain.split(":")[0].toLowerCase();

  if (cleanHost === cleanRoot || cleanHost === `www.${cleanRoot}`) {
    return { kind: "root" };
  }

  if (cleanHost === `app.${cleanRoot}`) {
    return { kind: "app" };
  }

  if (cleanHost.endsWith(`.${cleanRoot}`)) {
    const slug = cleanHost.slice(0, -1 * (cleanRoot.length + 1));
    return { kind: "partner", slug };
  }

  // Anything else = a custom domain pointed at us via CNAME.
  return { kind: "partner", customDomain: cleanHost };
}
