"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const CAPTCHA_PROVIDERS = [
  {
    id: "recaptcha",
    name: "Google reCAPTCHA",
    icon: "fa-solid fa-robot",
    color: "text-[#4285f4]",
    description: "Invisible bot detection using Google reCAPTCHA v3",
    url: "https://www.google.com/recaptcha/admin",
    urlLabel: "Get site key",
    fields: [
      { key: "siteKey", label: "Site Key", placeholder: "6Le..." },
      { key: "secretKey", label: "Secret Key", placeholder: "6Le..." },
    ],
  },
  {
    id: "turnstile",
    name: "Cloudflare Turnstile",
    icon: "fa-solid fa-shield-halved",
    color: "text-[#f38020]",
    description: "Privacy-friendly CAPTCHA alternative by Cloudflare",
    url: "https://dash.cloudflare.com/?to=/:account/turnstile",
    urlLabel: "Get site key",
    fields: [
      { key: "siteKey", label: "Site Key", placeholder: "0x..." },
      { key: "secretKey", label: "Secret Key", placeholder: "0x..." },
    ],
  },
] as const;

interface CaptchaIntegration {
  id: string;
  provider: string;
  connected_at: string;
}

export default function CaptchaIntegrationsSection({
  integrations,
}: {
  integrations: CaptchaIntegration[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const connectedMap = new Map(integrations.map((i) => [i.provider, i]));

  async function handleConnect(provider: string) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/captcha-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, siteKey, secretKey }),
      });
      if (!res.ok) throw new Error("Failed");
      setSiteKey("");
      setSecretKey("");
      setEditingProvider(null);
      startTransition(() => {
        router.refresh();
        const name = CAPTCHA_PROVIDERS.find((p) => p.id === provider)?.name ?? provider;
        setMsg(`${name} connected successfully.`);
      });
    } catch {
      setMsg("Failed to connect. Check your keys and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(provider: string) {
    const name = CAPTCHA_PROVIDERS.find((p) => p.id === provider)?.name ?? provider;
    if (!confirm(`Disconnect ${name}? Captcha fields using this provider will stop working.`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/captcha-integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => {
        router.refresh();
        setMsg(`${name} disconnected.`);
      });
    } catch {
      setMsg("Failed to disconnect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
      <h2 className="text-lg font-bold font-headline text-on-surface mb-1">
        Bot Protection
      </h2>
      <p className="text-sm text-on-surface-variant/60 mb-6">
        Add CAPTCHA verification to protect your forms from spam and bots.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CAPTCHA_PROVIDERS.map((provider) => {
          const integration = connectedMap.get(provider.id);
          const isConnected = !!integration;
          const isEditing = editingProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`rounded-xl border p-5 transition-all ${
                isConnected
                  ? "border-tertiary/20 bg-tertiary/[0.03]"
                  : "border-outline-variant/10 bg-surface-container-lowest/30"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isConnected ? "bg-tertiary/10" : "bg-surface-container-high/50"
                }`}>
                  <i className={`${provider.icon} text-lg ${isConnected ? provider.color : "text-on-surface-variant/40"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-on-surface">{provider.name}</h3>
                  <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{provider.description}</p>
                  {isConnected && (
                    <p className="text-[10px] text-tertiary font-semibold uppercase tracking-widest mt-1">
                      <i className="fa-solid fa-circle-check text-[8px] mr-1" />
                      Connected
                    </p>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={siteKey}
                    onChange={(e) => setSiteKey(e.target.value)}
                    placeholder="Site Key"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                    autoFocus
                  />
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Secret Key"
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/15 rounded-lg text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(provider.id)}
                      disabled={!siteKey || !secretKey || saving}
                      className="flex-1 px-3 py-2 text-xs font-bold text-on-primary bg-primary rounded-lg disabled:opacity-40"
                    >
                      {saving ? "Connecting..." : "Connect"}
                    </button>
                    <button
                      onClick={() => { setEditingProvider(null); setSiteKey(""); setSecretKey(""); }}
                      className="px-3 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant/15 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                    {provider.urlLabel}
                  </a>
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      disabled={pending || saving}
                      className="w-full px-4 py-2 text-xs font-bold text-error/70 border border-error/15 rounded-lg hover:bg-error/5 hover:text-error transition-all disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingProvider(provider.id)}
                      className="w-full px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all"
                    >
                      Connect {provider.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && (
        <p className={`text-xs font-medium mt-4 ${msg.includes("Failed") ? "text-error" : "text-tertiary"}`}>
          {msg}
        </p>
      )}
    </section>
  );
}
