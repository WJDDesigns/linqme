"use client";

import { useState } from "react";

const INPUT_CLS =
  "block w-full px-4 py-3 text-sm bg-surface-container-high/40 border border-outline-variant/10 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all duration-300";

const SUBJECTS = [
  "Bug Report",
  "Feature Request",
  "Account Issue",
  "Billing Question",
  "Other",
] as const;

interface SupportFormProps {
  defaultEmail?: string;
  defaultName?: string;
}

export default function SupportForm({ defaultEmail, defaultName }: SupportFormProps) {
  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-check text-primary text-xl" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">Message sent!</h3>
        <p className="text-sm text-on-surface-variant/70">
          Thanks for reaching out. We typically respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
            setSubject("");
          }}
          className="mt-6 text-sm text-primary hover:underline font-medium"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="font-label uppercase tracking-wider text-[11px] text-on-surface-variant/60">
          Name
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`mt-1.5 ${INPUT_CLS}`}
          placeholder="Your name"
        />
      </label>

      <label className="block">
        <span className="font-label uppercase tracking-wider text-[11px] text-on-surface-variant/60">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1.5 ${INPUT_CLS}`}
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="font-label uppercase tracking-wider text-[11px] text-on-surface-variant/60">
          Subject
        </span>
        <select
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`mt-1.5 ${INPUT_CLS} appearance-none`}
        >
          <option value="" disabled>
            Select a topic...
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="font-label uppercase tracking-wider text-[11px] text-on-surface-variant/60">
          Message
        </span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`mt-1.5 ${INPUT_CLS} resize-y min-h-[120px]`}
          placeholder="Describe your issue or question..."
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-primary text-on-primary px-4 py-3 text-sm font-bold hover:shadow-[0_0_30px_rgba(var(--color-primary),0.35)] disabled:opacity-60 transition-all duration-500 relative overflow-hidden group"
      >
        <span className="relative z-10">
          {status === "sending" ? "Sending..." : "Send Message"}
        </span>
      </button>

      {status === "error" && (
        <div className="rounded-xl bg-error/10 border border-error/15 px-3 py-2 text-sm text-error text-center">
          {errorMsg}
        </div>
      )}
    </form>
  );
}
