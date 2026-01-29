/**
 * BoardViewSwitcher Component
 * Tabs for filtering board by lane groups (All/Planning/Active/Complete)
 * BOS-UX-06
 */

/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind -- BOS-UX-06: Phase 0 scaffold UI */
"use client";

import type { Lane } from "@/lib/types";

export type BoardView = "all" | "planning" | "active" | "complete";

export interface BoardViewSwitcherProps {
  currentView: BoardView;
  onViewChange: (view: BoardView) => void;
}

interface ViewTab {
  id: BoardView;
  label: string;
}

const VIEW_TABS: ViewTab[] = [
  { id: "all", label: "All" },
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "complete", label: "Complete" },
];

/**
 * Get the lanes to display for a given board view
 */
export function getLanesForView(view: BoardView): Lane[] {
  switch (view) {
    case "all":
      return [
        "Inbox",
        "Fact-finding",
        "Planned",
        "In progress",
        "Blocked",
        "Done",
        "Reflected",
      ];
    case "planning":
      return ["Inbox", "Fact-finding", "Planned"];
    case "active":
      return ["In progress"];
    case "complete":
      return ["Done", "Reflected"];
  }
}

export function BoardViewSwitcher({
  currentView,
  onViewChange,
}: BoardViewSwitcherProps) {
  return (
    <div role="tablist" className="flex gap-1 p-1 bg-muted rounded-lg">
      {VIEW_TABS.map((tab) => {
        const isActive = tab.id === currentView;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onViewChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
