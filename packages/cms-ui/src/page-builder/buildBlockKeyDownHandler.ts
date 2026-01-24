import type { Dispatch, RefObject } from "react";

import type { Action } from "./state";

type Args = {
  locked: boolean;
  inlineEditing: boolean;
  containerRef: RefObject<HTMLElement | null>;
  gridEnabled: boolean;
  gridCols: number;
  nudgeSpacingByKeyboard: (type: "margin" | "padding", side: "left" | "right" | "top" | "bottom", delta: number) => void;
  nudgeResizeByKeyboard: (dir: "left" | "right" | "up" | "down", step: number) => void;
  parentSlots?: number;
  parentType?: string;
  currSlotKey?: string | undefined;
  componentId: string;
  dispatch: Dispatch<Action>;
  viewport: "desktop" | "tablet" | "mobile";
  t?: (key: string, vars?: Record<string, unknown>) => string;
};

const isArrowKey = (key: string) =>
  key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown";

const getGridStep = (gridEnabled: boolean, gridCols: number, el: HTMLElement | null, altStep: number) => {
  const parent = el?.parentElement ?? null;
  const unit = gridEnabled && parent ? parent.offsetWidth / gridCols : undefined;
  return unit ?? altStep;
};

const getSideFromKey = (key: string): "left" | "right" | "top" | "bottom" => {
  if (key === "arrowleft") return "left";
  if (key === "arrowright") return "right";
  if (key === "arrowup") return "top";
  return "bottom";
};

const getDirFromKey = (key: string): "left" | "right" | "up" | "down" => {
  if (key === "arrowleft") return "left";
  if (key === "arrowright") return "right";
  if (key === "arrowup") return "up";
  return "down";
};

const maybeMoveTab = ({
  e,
  key,
  parentSlots,
  parentType,
  currSlotKey,
  componentId,
  dispatch,
  t,
}: {
  e: React.KeyboardEvent;
  key: string;
  parentSlots: number | undefined;
  parentType: string | undefined;
  currSlotKey: string | undefined;
  componentId: string;
  dispatch: Dispatch<Action>;
  t?: (key: string, vars?: Record<string, unknown>) => string;
}) => {
  if (!(e.altKey && !e.metaKey && !e.ctrlKey)) return;
  if (key !== "arrowleft" && key !== "arrowright") return;
  const count = typeof parentSlots === "number" ? parentSlots : undefined;
  const isTabbedParent = parentType === "Tabs" || parentType === "TabsAccordionContainer";
  if (!isTabbedParent || !count || count <= 0) return;
  e.preventDefault();
  e.stopPropagation();
  const raw = currSlotKey;
  const curr = raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : 0;
  const delta = key === "arrowleft" ? -1 : 1;
  const next = Math.max(0, Math.min(count - 1, curr + delta));
  if (next === curr) return;
  dispatch({ type: "update", id: componentId, patch: { slotKey: String(next) } });
  try {
    const detail = String(t ? t("pb.toast.movedToTab", { tab: next + 1 }) : `Moved to tab ${next + 1}`);
    window.dispatchEvent(new CustomEvent("pb-live-message", { detail }));
  } catch {}
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
  t,
}: Args) {
  return (e: React.KeyboardEvent) => {
    if (locked || inlineEditing) return;
    const key = e.key.toLowerCase();
    if (!isArrowKey(key)) return;
    // Ctrl/Cmd + Arrow: spacing (Alt => padding, otherwise margin)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const step = getGridStep(gridEnabled, gridCols, containerRef.current, e.altKey ? 10 : 1);
      const type: "margin" | "padding" = e.altKey ? "padding" : "margin";
      const side = getSideFromKey(key);
      const delta = key === "arrowleft" || key === "arrowup" ? -step : step;
      nudgeSpacingByKeyboard(type, side, delta);
    }
    // Shift + Arrow: resize width/height
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const step = getGridStep(gridEnabled, gridCols, containerRef.current, e.altKey ? 10 : 1);
      const dir = getDirFromKey(key);
      nudgeResizeByKeyboard(dir, step);
    }
    // Alt + Left/Right: move across tabs when parent is tab container
    maybeMoveTab({ e, key, parentSlots, parentType, currSlotKey, componentId, dispatch, t });
  };
}
