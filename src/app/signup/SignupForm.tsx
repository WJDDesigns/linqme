"use client";

import { useState } from "react";
import Link from "next/link";
import { signupAction } from "./actions";

const INPUT_CLS =
  "block w-full px-4 py-3 text-sm bg-surface-container-lowest border-0 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none transition-all duration-200";

export default function SignupForm({ rootHost }: { rootHost: string }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const result = await signupAction(fd);

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    window.location.href = result.next;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-2xl border border-outline-variant/15 p-6 space-y-5"
    >
      <Field label="Your work email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={INPUT_CLS}
          placeholder="you@youragency.com"
        />
      </Field>

      <Field label="Create a password" hint="At least 8 characters.">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={INPUT_CLS}
        />
      </Field>

      <Field label="Company / agency name">
        <input
          name="company_name"
          required
          autoComplete="organization"
          className={INPUT_CLS}
          placeholder="Acme Creative"
        />
      </Field>

      <Field
        label="Your workspace URL"
        hint="Lowercase letters, numbers, hyphens. You can change this later."
      >
        <div className="flex items-center">
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            className={`${INPUT_CLS} rounded-r-none`}
            placeholder="acme"
          />
          <span className="px-3 py-3 text-sm text-on-surface-variant bg-surface-container-high border-0 rounded-r-xl whitespace-nowrap">
            .{rootHost}
          </span>
        </div>
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          What best describes you?
        </legend>
        <PlanOption
          name="plan_type"
          value="agency"
          defaultChecked
          title="I'm an agency or freelancer"
          desc="You'll onboard your own clients through one branded workspace."
        />
        <PlanOption
          name="plan_type"
          value="agency_plus_partners"
          title="I manage multiple brands / sub-partners"
          desc="You can spin up sub-partner workspaces, each with their own branding and team."
        />
      </fieldset>

      {error && (
        <div className="rounded-xl border border-error/20 bg-error-container/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-primary text-on-primary px-4 py-3 text-sm font-bold hover:shadow-[0_0_20px_rgba(192,193,255,0.3)] disabled:opacity-60 transition-all duration-300"
      >
        {submitting ? "Creating workspace..." : "Create workspace"}
      </button>

      <p className="text-xs text-on-surface-variant/60 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
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

function PlanOption({
  name,
  value,
  title,
  desc,
  defaultChecked,
}: {
  name: string;
  value: string;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/15 hover:border-primary/30 cursor-pointer has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5 transition-all duration-200">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-primary"
      />
      <div>
        <div className="text-sm font-medium text-on-surface">{title}</div>
        <div className="text-xs text-on-surface-variant/60 mt-0.5">{desc}</div>
      </div>
    </label>
  );
}
