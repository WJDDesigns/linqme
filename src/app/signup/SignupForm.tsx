"use client";

import { useState } from "react";
import Link from "next/link";
import { signupAction } from "./actions";

const INPUT_CLS =
  "block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none";

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

    // Hard navigation so the server picks up the fresh auth cookie.
    // Using the current origin avoids Next 15's server-side host-resolution bug.
    window.location.href = result.next;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm"
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
          <span className="px-3 py-2 text-sm text-slate-500 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg whitespace-nowrap">
            .{rootHost}
          </span>
        </div>
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Creating workspace…" : "Create workspace →"}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline">
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
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mt-0.5 mb-1.5">{hint}</span>}
      <div className="mt-1">{children}</div>
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
    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-400 cursor-pointer has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50 transition">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 text-slate-900 focus:ring-slate-900"
      />
      <div>
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{desc}</div>
      </div>
    </label>
  );
}
