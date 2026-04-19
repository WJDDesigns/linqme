"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "status", label: "Status Page", icon: "fa-signal" },
  { id: "banner", label: "Banner", icon: "fa-bullhorn" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  statusContent: React.ReactNode;
  bannerContent: React.ReactNode;
}

export default function AnnounceTabs({ statusContent, bannerContent }: Props) {
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("section");
  const resolvedDefault = TABS.find((t) => t.id === urlTab) ? (urlTab as TabId) : "status";
  const [active, setActive] = useState<TabId>(resolvedDefault);

  useEffect(() => {
    const param = searchParams.get("section");
    if (param && TABS.find((t) => t.id === param) && param !== active) {
      setActive(param as TabId);
    }
  }, [searchParams, active]);

  const switchTab = useCallback((tabId: TabId) => {
    setActive(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "status") {
      params.delete("section");
    } else {
      params.set("section", tabId);
    }
    const qs = params.toString();
    const url = `/dashboard/admin/announce${qs ? `?${qs}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, [searchParams]);

  const panels: Record<TabId, React.ReactNode> = {
    status: statusContent,
    banner: bannerContent,
  };

  return (
    <>
      <div className="flex gap-1 p-1 rounded-xl bg-surface-container-high/40 border border-outline-variant/[0.08]">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {panels[active]}
      </div>
    </>
  );
}
