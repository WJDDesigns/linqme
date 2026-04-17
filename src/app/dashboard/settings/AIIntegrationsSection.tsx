"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AIProvider = "openai" | "anthropic" | "google_ai";

interface AIIntegration {
  id: string;
  provider: string;
  model_preference: string | null;
  connected_at: string;
}

interface ProviderMeta {
  displayName: string;
  icon: string;
  color: string;
  models: { value: string; label: string }[];
  apiKeyUrl: string;
  apiKeyLabel: string;
}

const PROVIDER_META: Record<AIProvider, ProviderMeta> = {
  openai: {
    displayName: "OpenAI",
    icon: "fa-solid fa-robot",
    color: "text-[#10a37f]",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
    apiKeyUrl: "https://platform.openai.com/api-keys",
    apiKeyLabel: "Get your API key from OpenAI",
  },
  anthropic: {
    displayName: "Anthropic (Claude)",
    icon: "fa-solid fa-brain",
    color: "text-[#cc785c]",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    apiKeyLabel: "Get your API key from Anthropic",
  },
  google_ai: {
    displayName: "Google AI (Gemini)",
    icon: "fa-brands fa-google",
    color: "text-[#4285F4]",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
    apiKeyUrl: "https://aistudio.google.com/apikey",
    apiKeyLabel: "Get your API key from Google AI Studio",
  },
};

const ALL_AI_PROVIDERS: AIProvider[] = ["openai", "anthropic", "google_ai"];

export default function AIIntegrationsSection({
  aiIntegrations,
}: {
  aiIntegrations: AIIntegration[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Form state per provider
  const [formState, setFormState] = useState<
    Record<string, { apiKey: string; modelPreference: string; showKey: boolean }>
  >({});

  const connectedMap = new Map(aiIntegrations.map((i) => [i.provider, i]));

  function getForm(provider: AIProvider) {
    return formState[provider] ?? { apiKey: "", modelPreference: "", showKey: false };
  }

  function updateForm(provider: AIProvider, patch: Partial<{ apiKey: string; modelPreference: string; showKey: boolean }>) {
    setFormState((prev) => ({
      ...prev,
      [provider]: { ...getForm(provider), ...patch },
    }));
  }

  async function handleConnect(provider: AIProvider) {
    const form = getForm(provider);
    if (!form.apiKey.trim()) {
      setMsg("Please enter an API key.");
      return;
    }

    setLoadingProvider(provider);
    setMsg(null);

    try {
      const res = await fetch("/api/ai-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: form.apiKey.trim(),
          modelPreference: form.modelPreference || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to connect");
      }

      startTransition(() => {
        router.refresh();
        setMsg(`${PROVIDER_META[provider].displayName} connected successfully.`);
      });

      // Clear form
      setFormState((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setMsg(message);
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleDisconnect(provider: AIProvider) {
    const meta = PROVIDER_META[provider];
    if (!confirm(`Disconnect ${meta.displayName}? AI features using this provider will stop working.`)) {
      return;
    }

    setLoadingProvider(provider);
    setMsg(null);

    try {
      const res = await fetch("/api/ai-integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) throw new Error("Failed to disconnect");

      startTransition(() => {
        router.refresh();
        setMsg(`${meta.displayName} disconnected.`);
      });
    } catch {
      setMsg("Failed to disconnect. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <section className="rounded-2xl border border-outline-variant/[0.08] bg-surface-container/50 shadow-xl shadow-black/10 p-6 md:p-8">
      <h2 className="text-lg font-bold font-headline text-on-surface mb-1">
        AI Providers
      </h2>
      <p className="text-sm text-on-surface-variant/60 mb-6">
        Connect your AI provider to enable smart features like competitor analysis and content suggestions. You provide your own API key.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ALL_AI_PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const integration = connectedMap.get(provider);
          const isConnected = !!integration;
          const form = getForm(provider);
          const isLoading = loadingProvider === provider;

          return (
            <div
              key={provider}
              className={`rounded-xl border p-5 transition-all ${
                isConnected
                  ? "border-tertiary/20 bg-tertiary/[0.03]"
                  : "border-outline-variant/10 bg-surface-container-lowest/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isConnected ? "bg-tertiary/10" : "bg-surface-container-high/50"
                    }`}
                  >
                    <i
                      className={`${meta.icon} text-lg ${
                        isConnected ? meta.color : "text-on-surface-variant/40"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      {meta.displayName}
                    </h3>
                    {isConnected && integration.model_preference && (
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">
                        Model: {integration.model_preference}
                      </p>
                    )}
                    {isConnected && (
                      <p className="text-[10px] text-tertiary font-semibold uppercase tracking-widest mt-1">
                        <i className="fa-solid fa-circle-check text-[8px] mr-1" />
                        Connected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(provider)}
                    disabled={pending || isLoading}
                    className="w-full px-4 py-2 text-xs font-bold text-error/70 border border-error/15 rounded-lg hover:bg-error/5 hover:text-error transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Link to get API key */}
                    <a
                      href={meta.apiKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                      {meta.apiKeyLabel}
                    </a>
                    {/* API Key input */}
                    <div className="relative">
                      <input
                        type={form.showKey ? "text" : "password"}
                        placeholder="API Key"
                        value={form.apiKey}
                        onChange={(e) => updateForm(provider, { apiKey: e.target.value })}
                        className="w-full px-3 py-2 pr-10 text-xs bg-surface-container-high/30 border border-outline-variant/10 rounded-lg text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => updateForm(provider, { showKey: !form.showKey })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors"
                      >
                        <i className={`fa-solid ${form.showKey ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                      </button>
                    </div>

                    {/* Model preference dropdown */}
                    <select
                      value={form.modelPreference}
                      onChange={(e) => updateForm(provider, { modelPreference: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-container-high/30 border border-outline-variant/10 rounded-lg text-on-surface focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Default model</option>
                      {meta.models.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    {/* Connect button */}
                    <button
                      onClick={() => handleConnect(provider)}
                      disabled={pending || isLoading || !form.apiKey.trim()}
                      className="w-full px-4 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Connecting..." : `Connect ${meta.displayName}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {msg && (
        <p
          className={`text-xs font-medium mt-4 ${
            msg.includes("Failed") || msg.includes("Please") ? "text-error" : "text-tertiary"
          }`}
        >
          {msg}
        </p>
      )}
    </section>
  );
}
