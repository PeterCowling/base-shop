import type { PageComponent, HistoryState } from "@acme/types";
import type { Action, ResizeAction } from "../state/layout/types";
import { useCallback } from "react";

interface Args {
  components: PageComponent[];
  selectedIds: string[];
  editor?: HistoryState["editor"];
  dispatch: (action: Action) => void;
  viewport: "desktop" | "tablet" | "mobile";
}

const useCenterInParent = ({ components, selectedIds, editor, dispatch, viewport }: Args) => {
  const centerInParentX = useCallback(() => {
    const allowed = new Set(components.filter((c) => c.position === "absolute" && !(editor?.[c.id]?.locked)).map((c) => c.id));
    selectedIds.filter((id) => allowed.has(id)).forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const left = Math.round((parent.clientWidth - el.offsetWidth) / 2);
      const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
      const action: ResizeAction = { type: "resize", id, [leftKey]: `${left}px` } as ResizeAction;
      dispatch(action);
    });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered horizontally in parent" })); } catch {} // i18n-exempt -- PB-000 devtools status toast
  }, [components, dispatch, editor, selectedIds, viewport]);

  const centerInParentY = useCallback(() => {
    const allowed = new Set(components.filter((c) => c.position === "absolute" && !(editor?.[c.id]?.locked)).map((c) => c.id));
    selectedIds.filter((id) => allowed.has(id)).forEach((id) => {
      const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
      const parent = (el?.offsetParent as HTMLElement | null) ?? el?.parentElement ?? null;
      if (!el || !parent) return;
      const top = Math.round((parent.clientHeight - el.offsetHeight) / 2);
      const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";
      const action: ResizeAction = { type: "resize", id, [topKey]: `${top}px` } as ResizeAction;
      dispatch(action);
    });
    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Centered vertically in parent" })); } catch {} // i18n-exempt -- PB-000 devtools status toast
  }, [components, dispatch, editor, selectedIds, viewport]);

  return { centerInParentX, centerInParentY };
};

export default useCenterInParent;
