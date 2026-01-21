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
    <div className="relative">
      {/* Position within local stacking context; avoid z-index on non-layered UI */}
      <div
        className="absolute start-1 top-1 rounded bg-primary/90 px-1 py-0.5 text-xs text-foreground shadow"
        // i18n-exempt: editor-only helper badge; not user-visible content
        title={isHiddenHere ? `Hidden on ${viewport}` : `Hidden on ${hiddenList.join(', ')}`}
      >
        {/* i18n-exempt -- PB-2413: editor-only status string */}
        {isHiddenHere ? `Hidden on ${viewport}` : `Hidden on ${hiddenList.join(', ')}`}
        {isHiddenHere && (
          <button
            type="button"
            className="ms-2 inline-flex min-h-10 min-w-10 items-center justify-center px-2 py-1 underline"
            onClick={(e) => {
              e.stopPropagation();
              const cur = (editor ?? {})[componentId]?.hidden ?? [];
              const set = new Set(cur as ("mobile" | "desktop" | "tablet")[]);
              set.delete(viewport);
              dispatch({ type: "update-editor", id: componentId, patch: { hidden: Array.from(set) } });
              try {
                // i18n-exempt -- PB-2413: developer toast event only
                window.dispatchEvent(new CustomEvent('pb-live-message', { detail: `Shown on ${viewport}` }));
              } catch {}
            }}
          >
            {/* i18n-exempt -- PB-2413: editor-only control label */}
            Show for this device
          </button>
        )}
      </div>
    </div>
  );
}
