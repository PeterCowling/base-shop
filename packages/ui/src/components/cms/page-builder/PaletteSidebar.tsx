"use client";

import React from "react";
import Palette from "./Palette";
import type { ComponentType } from "./defaults";

interface Props {
  width: number;
  onWidthChange: (w: number) => void;
  onAdd: (type: ComponentType) => void;
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
}

/**
 * Renders the left palette sidebar, including a drag-resize handle.
 * Single purpose: palette column UI + width resize behavior.
 */
const PaletteSidebar = ({ width, onWidthChange, onAdd, onInsertImage, onSetSectionBackground, selectedIsSection }: Props) => (
  <>
    <aside className="shrink-0" style={{ width }} data-tour="palette" data-cy="pb-palette">
      <Palette
        onAdd={onAdd}
        onInsertImage={onInsertImage}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
      />
    </aside>
    <div
      role="separator"
      aria-label="Resize palette"
      className="w-1 shrink-0 cursor-col-resize select-none bg-border/50 hover:bg-border"
      onPointerDown={(e) => {
        const startX = e.clientX;
        const startW = width;
        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          const next = Math.min(Math.max(startW + dx, 160), 360);
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

export default PaletteSidebar;

