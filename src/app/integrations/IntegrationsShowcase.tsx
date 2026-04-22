"use client";

import { useState, useMemo } from "react";
import {
  INTEGRATIONS,
  CATEGORIES,
  getCategoryCounts,
  type IntegrationCategory,
  type IntegrationDef,
} from "@/lib/integrations/catalogue";

type FilterId = IntegrationCategory | "all" | "popular";

export default function IntegrationsShowcase() {
  const [activeCategory, setActiveCategory] = useState<FilterId>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => getCategoryCounts(), []);

  const filtered = useMemo(() => {
    let items: IntegrationDef[];
    if (activeCategory === "all") items = INTEGRATIONS;
    else if (activeCategory === "popular") items = INTEGRATIONS.filter((i) => i.popular);
    else items = INTEGRATIONS.filter((i) => i.category === activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return items;
  }, [activeCategory, search]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-32">
          {/* Search */}
          <div className="relative mb-6">
            <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container/50 border border-outline-variant/[0.08] text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
            />
          </div>

          {/* Category list */}
          <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as FilterId)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface border border-transparent"
                  }`}
                >
                  <i className={`${cat.icon} w-4 text-center text-xs ${isActive ? "text-primary" : "text-on-surface-variant/60"}`} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  <span className={`text-xs tabular-nums ${isActive ? "text-primary/70" : "text-on-surface-variant/30"}`}>
                    {counts[cat.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Grid */}
      <div className="flex-1 min-w-0">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <i className="fa-solid fa-magnifying-glass text-3xl text-on-surface-variant/20 mb-4 block" />
            <p className="text-on-surface-variant/50 text-sm">No integrations found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationDef }) {
  const isComingSoon = integration.status === "coming_soon";

  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/[0.08] p-5 hover:border-outline-variant/15 transition-all duration-300 glow-card group">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-surface-container/60 border border-outline-variant/[0.06] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
          <i className={`${integration.icon} text-lg ${integration.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-on-surface text-sm truncate">{integration.name}</h3>
            {isComingSoon ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-on-surface-variant/[0.08] text-on-surface-variant/50 shrink-0">
                Soon
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary/10 text-tertiary shrink-0">
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant/60 leading-relaxed line-clamp-2">
            {integration.description}
          </p>
        </div>
      </div>
    </div>
  );
}
