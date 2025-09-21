"use client";

import type { HistoryState } from "@acme/types";
import type { Action } from "./state";

type Props = {
  hiddenList: ("desktop" | "tablet" | "mobile")[];
  isHiddenHere: boolean;
  viewport: "desktop" | "tablet" | "mobile";
  componentId: string;
  editor?: HistoryState["editor"];
  dispatch: React.Dispatch<Action>;
};

export default function HiddenBadge({ hiddenList, isHiddenHere, viewport, componentId, editor, dispatch }: Props) {
  if (hiddenList.length === 0) return null;
  return (
    <div className="absolute left-1 top-1 z-30 rounded bg-amber-500/90 px-1 py-0.5 text-[10px] text-white shadow" title={isHiddenHere ? `Hidden on ${viewport}` : `Hidden on ${hiddenList.join(', ')}`}>
      {isHiddenHere ? `Hidden on ${viewport}` : `Hidden on ${hiddenList.join(', ')}`}
      {isHiddenHere && (
        <button
          type="button"
          className="ml-2 underline"
          onClick={(e) => {
            e.stopPropagation();
            const cur = (editor ?? {})[componentId]?.hidden ?? [];
            const set = new Set(cur as string[]);
            set.delete(viewport);
            dispatch({ type: "update-editor", id: componentId, patch: { hidden: Array.from(set) } as any });
            try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: `Shown on ${viewport}` })); } catch {}
          }}
        >
          Show for this device
        </button>
      )}
    </div>
  );
}

