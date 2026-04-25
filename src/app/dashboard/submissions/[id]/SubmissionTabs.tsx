"use client";

import { useState } from "react";

interface Props {
  responsesContent: React.ReactNode;
  filesContent: React.ReactNode;
  fileCount: number;
}

export default function SubmissionTabs({ responsesContent, filesContent, fileCount }: Props) {
  const [tab, setTab] = useState<"responses" | "files">("responses");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["responses"]));

  function toggleSection(section: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  return (
    <div className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Desktop: Tab bar */}
      <div className="hidden sm:flex px-5 sm:px-8 pt-4 border-b border-outline-variant/10 items-center gap-1">
        <button
          onClick={() => setTab("responses")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all relative ${
            tab === "responses"
              ? "text-primary"
              : "text-on-surface-variant/50 hover:text-on-surface-variant"
          }`}
        >
          <i className="fa-solid fa-list-check text-[10px] mr-1.5" />
          Responses
          {tab === "responses" && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTab("files")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all relative flex items-center gap-1.5 ${
            tab === "files"
              ? "text-primary"
              : "text-on-surface-variant/50 hover:text-on-surface-variant"
          }`}
        >
          <i className="fa-solid fa-paperclip text-[10px]" />
          Files
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
            tab === "files"
              ? "bg-primary/15 text-primary"
              : "bg-surface-container-high/50 text-on-surface-variant/50"
          }`}>
            {fileCount}
          </span>
          {tab === "files" && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Desktop: Tab content */}
      <div className="hidden sm:block">
        {tab === "responses" ? responsesContent : filesContent}
      </div>

      {/* Mobile: Accordion layout */}
      <div className="sm:hidden">
        {/* Responses accordion */}
        <button
          onClick={() => toggleSection("responses")}
          className="w-full flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
            <i className="fa-solid fa-list-check text-[10px] text-primary" />
            Responses
          </span>
          <i className={`fa-solid fa-chevron-down text-[10px] text-on-surface-variant/40 transition-transform duration-200 ${expandedSections.has("responses") ? "rotate-180" : ""}`} />
        </button>
        {expandedSections.has("responses") && responsesContent}

        {/* Files accordion */}
        <button
          onClick={() => toggleSection("files")}
          className="w-full flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/10"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
            <i className="fa-solid fa-paperclip text-[10px] text-primary" />
            Files
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-surface-container-high/50 text-on-surface-variant/50">
              {fileCount}
            </span>
          </span>
          <i className={`fa-solid fa-chevron-down text-[10px] text-on-surface-variant/40 transition-transform duration-200 ${expandedSections.has("files") ? "rotate-180" : ""}`} />
        </button>
        {expandedSections.has("files") && filesContent}
      </div>
    </div>
  );
}
