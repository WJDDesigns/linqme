"use client";

import { useState } from "react";

interface Props {
  responsesContent: React.ReactNode;
  filesContent: React.ReactNode;
  fileCount: number;
}

export default function SubmissionTabs({ responsesContent, filesContent, fileCount }: Props) {
  const [tab, setTab] = useState<"responses" | "files">("responses");

  return (
    <div className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Tab bar */}
      <div className="px-5 sm:px-8 pt-4 border-b border-outline-variant/10 flex items-center gap-1">
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

      {/* Tab content */}
      {tab === "responses" ? responsesContent : filesContent}
    </div>
  );
}
