import type { RefObject } from "react";
import type { Action } from "./state";

type Args = {
  locked: boolean;
  inlineEditing: boolean;
  containerRef: RefObject<HTMLElement>;
  gridEnabled: boolean;
  gridCols: number;
  nudgeSpacingByKeyboard: (type: "margin" | "padding", side: "left" | "right" | "top" | "bottom", delta: number) => void;
  nudgeResizeByKeyboard: (dir: "left" | "right" | "up" | "down", step: number) => void;
  parentSlots?: number;
  parentType?: string;
  currSlotKey?: string | undefined;
  componentId: string;
  dispatch: React.Dispatch<Action>;
  viewport: "desktop" | "tablet" | "mobile";
};

export default function buildBlockKeyDownHandler({
  locked,
  inlineEditing,
  containerRef,
  gridEnabled,
  gridCols,
  nudgeSpacingByKeyboard,
  nudgeResizeByKeyboard,
  parentSlots,
  parentType,
  currSlotKey,
  componentId,
  dispatch,
  viewport: _viewport,
}: Args) {
  return (e: React.KeyboardEvent) => {
    if (locked || inlineEditing) return;
    const key = e.key.toLowerCase();
    const isArrow = key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown";
    if (!isArrow) return;
    // Ctrl/Cmd + Arrow: spacing (Alt => padding, otherwise margin)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const el = containerRef.current;
      const parent = el?.parentElement ?? null;
      const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
      const step = unit ?? (e.altKey ? 10 : 1);
      const type = e.altKey ? "padding" : "margin";
      const side = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "top" : "bottom";
      const delta = key === "arrowleft" || key === "arrowup" ? -step : step;
      nudgeSpacingByKeyboard(type as any, side as any, delta);
    }
    // Shift + Arrow: resize width/height
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const el = containerRef.current;
      const parent = el?.parentElement ?? null;
      const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
      const step = unit ?? (e.altKey ? 10 : 1);
      const dir = key === "arrowleft" ? "left" : key === "arrowright" ? "right" : key === "arrowup" ? "up" : "down";
      nudgeResizeByKeyboard(dir as any, step);
    }
    // Alt + Left/Right: move across tabs when parent is tab container
    if (e.altKey && !e.metaKey && !e.ctrlKey && (key === "arrowleft" || key === "arrowright")) {
      const count = typeof parentSlots === 'number' ? parentSlots : undefined;
      const isTabbedParent = parentType === 'Tabs' || parentType === 'TabsAccordionContainer';
      if (isTabbedParent && count && count > 0) {
        e.preventDefault();
        e.stopPropagation();
        const raw = currSlotKey;
        const curr = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0;
        const delta = key === 'arrowleft' ? -1 : 1;
        const next = Math.max(0, Math.min(count - 1, curr + delta));
        if (next !== curr) {
          dispatch({ type: 'update', id: componentId, patch: { slotKey: String(next) } as any });
          try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: `Moved to tab ${next + 1}` })); } catch {}
        }
      }
    }
  };
}
