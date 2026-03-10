"use client";

import { useState } from "react";

import type { StageDoc } from "@/lib/types";

import { MarkdownContent } from "./MarkdownContent";

interface CardStageDocsProps {
  stageDocs: StageDoc[];
}

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */
export function CardStageDocs({ stageDocs }: CardStageDocsProps) {
  const [openStages, setOpenStages] = useState<Set<string>>(
    new Set(stageDocs[0] ? [stageDocs[0].Stage] : [])
  );

  const toggleStage = (stage: string) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  if (stageDocs.length === 0) {
    return null;
  }

  const availableStages = [...stageDocs].sort((left, right) =>
    left.Stage.localeCompare(right.Stage)
  );

  const formatStageLabel = (stage: string) =>
    stage
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  return (
    <div className="bg-panel rounded-lg border border-border-1 p-6">
      <h2 className="text-lg font-semibold text-fg mb-4">Card Documents</h2>
      <div className="space-y-3">
        {availableStages.map((doc) => (
          <div key={doc.Stage} className="border border-border-1 rounded-lg">
            <button
              type="button"
              onClick={() => toggleStage(doc.Stage)}
              className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-surface-1"
            >
              <span className="text-sm font-medium text-fg">
                {formatStageLabel(doc.Stage)}
              </span>
              <svg
                className={`w-5 h-5 text-muted transition-transform ${
                  openStages.has(doc.Stage) ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openStages.has(doc.Stage) && (
              <div className="px-4 pb-4 border-t border-border-1">
                <MarkdownContent content={doc.content} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
