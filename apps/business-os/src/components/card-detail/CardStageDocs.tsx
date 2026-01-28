"use client";

import { useState } from "react";

import type { StageDoc } from "@/lib/types";

import { MarkdownContent } from "./MarkdownContent";

interface CardStageDocsProps {
  stageDocs: {
    factFind?: StageDoc;
    plan?: StageDoc;
    build?: StageDoc;
    reflect?: StageDoc;
  };
  cardId: string;
}

/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */
export function CardStageDocs({ stageDocs }: CardStageDocsProps) {
  const [openStages, setOpenStages] = useState<Set<string>>(
    new Set(["factFind"])
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

  const stages = [
    { key: "factFind", label: "Fact Finding", doc: stageDocs.factFind },
    { key: "plan", label: "Plan", doc: stageDocs.plan },
    { key: "build", label: "Build Log", doc: stageDocs.build },
    { key: "reflect", label: "Reflection", doc: stageDocs.reflect },
  ];

  const availableStages = stages.filter((stage) => stage.doc);

  if (availableStages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Documents</h2>
      <div className="space-y-3">
        {availableStages.map(({ key, label, doc }) => (
          <div key={key} className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleStage(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{label}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openStages.has(key) ? "transform rotate-180" : ""
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
            {openStages.has(key) && doc && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <MarkdownContent content={doc.content} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
