import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { createPartnerAction } from "./actions";
import ColorInput from "@/components/ColorInput";

const INPUT_CLS =
  "block w-full px-4 py-3 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none transition-all duration-200";

export default async function NewPartnerPage() {
  await requireSuperadmin();
  const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linqme.io").replace(/:\d+$/, "");

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8"><div className="max-w-2xl space-y-6">
      <header>
        <Link href="/dashboard/partners" className="text-xs text-on-surface-variant/60 hover:text-primary transition-colors">
          <i className="fa-solid fa-arrow-left text-[10px] mr-1" /> Partners
        </Link>
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mt-2">New partner</h1>
        <p className="text-on-surface-variant mt-1">
          Create a new partner tenant. They&apos;ll get their own subdomain and branding.
        </p>
      </header>

      <form
        action={createPartnerAction}
        className="glass-panel rounded-2xl border border-outline-variant/15 p-6 space-y-5"
      >
        <Field label="Name" hint="Displayed to their clients.">
          <input name="name" required autoFocus className={INPUT_CLS} placeholder="Acme Agency" />
        </Field>

        <Field
          label="Slug"
          hint="Used for their subdomain. Lowercase letters, numbers, hyphens only."
        >
          <div className="flex items-center">
            <input
              name="slug"
              required
              pattern="[a-z0-9-]+"
              className={`${INPUT_CLS} rounded-r-none`}
              placeholder="pop"
            />
            <span className="px-3 py-3 text-sm text-on-surface-variant bg-surface-container-high border-0 rounded-r-xl whitespace-nowrap">
              .{rootHost}
            </span>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Primary color">
            <ColorInput name="primary_color" defaultValue="#c0c1ff" />
          </Field>
          <Field label="Accent color">
            <ColorInput name="accent_color" defaultValue="#3cddc7" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Support email" hint="Shown on their onboarding pages.">
            <input
              name="support_email"
              type="email"
              className={INPUT_CLS}
              placeholder="hello@popmarketing.com"
            />
          </Field>
          <Field label="Support phone">
            <input
              name="support_phone"
              type="tel"
              className={INPUT_CLS}
              placeholder="555-123-4567"
            />
          </Field>
        </div>

        <Field
          label="Custom domain (optional)"
          hint="Partner can point a CNAME here later."
        >
          <input
            name="custom_domain"
            className={INPUT_CLS}
            placeholder="onboard.popmarketing.com"
          />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/partners"
            className="text-sm text-on-surface-variant/60 hover:text-on-surface transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] transition-all"
          >
            Create partner
          </button>
        </div>
      </form>
    </div></div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">{label}</span>
      {hint && <span className="block text-xs text-on-surface-variant/60 mt-0.5 mb-1.5">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
