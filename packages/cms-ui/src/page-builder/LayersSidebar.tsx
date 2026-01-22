"use client";

import React from "react";

import type { HistoryState,PageComponent } from "@acme/types";

import LayersPanel from "./LayersPanel";
import type { Action } from "./state";

interface Props {
  width: number;
  onWidthChange: (w: number) => void;
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  crossNotices?: boolean;
}

// Simple left sidebar wrapper for LayersPanel with a resize handle, mirroring PaletteSidebar UX
const LayersSidebar = ({ width, onWidthChange, components, selectedIds, onSelectIds, dispatch, editor, viewport, crossNotices = true }: Props) => (
  <>
    {/* i18n-exempt -- test selector attribute */}
    { }
    <aside className="shrink-0" style={{ width }} data-cy="pb-layers-left">
      <div className="p-2">
        <LayersPanel
          components={components}
          selectedIds={selectedIds}
          onSelectIds={onSelectIds}
          dispatch={dispatch}
          editor={editor}
          viewport={viewport}
          crossNotices={crossNotices}
        />
      </div>
    </aside>
    <div
      role="separator"
      // i18n-exempt — editor-only control
       
      aria-label={(s => s)("Resize layers")}
      className="w-1 shrink-0 cursor-col-resize select-none bg-border/50 hover:bg-border"
      onPointerDown={(e) => {
        const startX = e.clientX;
        const startW = width;
        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          const next = Math.min(Math.max(startW + dx, 200), 360);
          onWidthChange(next);
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
    />
  </>
);

export default LayersSidebar;
