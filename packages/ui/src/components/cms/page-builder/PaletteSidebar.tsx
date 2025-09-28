"use client";
/* eslint-disable react/forbid-dom-props -- LINT-1007: fixed palette width uses inline style to avoid arbitrary Tailwind values */

import React from "react";
import Palette from "./Palette";
import type { ComponentType } from "./defaults";
import type { PageComponent } from "@acme/types";

interface Props {
  width: number;
  onWidthChange: (w: number) => void;
  onAdd: (type: ComponentType) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onInsertPreset?: (component: PageComponent) => void;
  mode?: "elements" | "sections" | "all";
}

/**
 * Renders the left palette sidebar, including a drag-resize handle.
 * Single purpose: palette column UI + width resize behavior.
 */
const PaletteSidebar = ({ width: _width, onWidthChange, onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, onInsertPreset, mode = "all" }: Props) => (
  <>
    <aside className="shrink-0" style={{ width: 350 }} data-tour="palette" data-cy="pb-palette">
      <Palette
        onAdd={onAdd}
        onInsertImage={onInsertImage}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
        onInsertPreset={onInsertPreset}
        mode={mode}
      />
    </aside>
    <div
      role="separator"
      aria-label="Resize palette"
      className="w-1 shrink-0 cursor-col-resize select-none bg-border/50 hover:bg-border"
      onPointerDown={(e) => {
        const startX = e.clientX;
        const startW = 350;
        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          // Fixed width: keep at 350px regardless of drag
          const _ = dx + startW; // keep references for potential future use
          void _;
          onWidthChange(350);
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

export default PaletteSidebar;
