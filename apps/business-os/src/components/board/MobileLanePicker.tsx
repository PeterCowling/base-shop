/**
 * MobileLanePicker Component
 * BOS-P2-03 Phase 2: Bottom tab bar for mobile lane selection
 */

"use client";

import type { Lane } from "@/lib/types";

import { getLaneHeaderColor } from "./BoardLane";

export interface MobileLanePickerProps {
  lanes: Lane[];
  activeLane: Lane;
  onLaneChange: (lane: Lane) => void;
  cardCountByLane: Record<Lane, number>;
}

/**
 * Get border color matching lane header semantic color
 */
function getLaneBorderColor(lane: Lane): string {
  const headerColor = getLaneHeaderColor(lane);

  // Map soft background colors to matching border colors
  if (headerColor === "bg-info-soft") return "border-info";
  if (headerColor === "bg-success-soft") return "border-success";
  if (headerColor === "bg-warning-soft") return "border-warning";
  return "border-muted-foreground";
}

/* eslint-disable ds/enforce-layout-primitives, ds/no-nonlayered-zindex, ds/absolute-parent-guard -- BOS-P2-03 Phase 0 mobile UI scaffold [ttl=2026-03-31] */
export function MobileLanePicker({
  lanes,
  activeLane,
  onLaneChange,
  cardCountByLane,
}: MobileLanePickerProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-card border-t border-border-2 md:hidden z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="tablist"
      aria-label="Lane selector"
    >
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {lanes.map((lane) => {
          const isActive = lane === activeLane;
          const cardCount = cardCountByLane[lane] || 0;
          const borderColor = getLaneBorderColor(lane);

          return (
            <button
              key={lane}
              role="tab"
              aria-selected={isActive}
              onClick={() => onLaneChange(lane)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLaneChange(lane);
                }
              }}
              className={`
                flex-shrink-0 snap-center px-4 py-3 min-w-[100px] min-h-11
                flex flex-col items-center justify-center gap-1
                border-t-2 transition-all duration-200 ease-in-out
                ${isActive ? borderColor : "border-transparent"}
                ${isActive ? "bg-surface-2" : "hover:bg-surface-1"}
              `}
            >
              <span className={`text-xs font-medium truncate max-w-[80px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {lane}
              </span>
              <span className={`text-xs ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {cardCount}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
