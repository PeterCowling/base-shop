import type { HistoryState,PageComponent } from "@acme/types";

import type { Action } from "../state";
import type { EditorFlags } from "../state/layout/types";
import { walkTree } from "../state/layout/utils";

type Node = PageComponent & { children?: PageComponent[] };

type EditorMap = Record<string, EditorFlags>;

export function applyDesktopOrderAcrossBreakpoints(
  components: PageComponent[],
  editor: HistoryState["editor"] | undefined,
  dispatch: (action: Action) => void,
): void {
  const editorMap: EditorMap = (editor ?? {}) as EditorMap;
  const getDesktopStrategy = (parentId: string): "default" | "reverse" | "custom" => {
    const p = editorMap?.[parentId];
    const strat = p?.stackDesktop as "default" | "reverse" | "custom" | undefined;
    return strat ?? "default";
  };
  const computeEffectiveDesktopOrder = (parent: Node): string[] => {
    const children = (parent.children ?? []) as Node[];
    // start with underlying order and keep original index for stable sort
    let arr = children.map((c, idx) => ({ id: c.id, idx }));
    const strat = getDesktopStrategy(parent.id);
    if (strat === "reverse") {
      arr = [...arr].reverse();
    } else if (strat === "custom") {
      arr = [...arr].sort((a, b) => {
        const oa = editorMap?.[a.id]?.orderDesktop as number | undefined;
        const ob = editorMap?.[b.id]?.orderDesktop as number | undefined;
        const da = oa === undefined ? Number.POSITIVE_INFINITY : oa;
        const db = ob === undefined ? Number.POSITIVE_INFINITY : ob;
        if (da === db) return a.idx - b.idx;
        return da - db;
      });
    }
    return arr.map((x) => x.id);
  };

  walkTree(components, (node) => {
    const kids = (node as PageComponent & { children?: PageComponent[] }).children;
    if (!Array.isArray(kids) || kids.length === 0) return;
    const orderedIds = computeEffectiveDesktopOrder(node as Node);
    // Mark parent to use custom stacking on tablet/mobile
    dispatch({ type: "update-editor", id: (node as PageComponent & { id: string }).id, patch: { stackTablet: "custom", stackMobile: "custom" } });
    // Apply per-child tablet/mobile order values based on desktop order
    orderedIds.forEach((childId, idx) => {
      dispatch({ type: "update-editor", id: childId, patch: { orderTablet: idx, orderMobile: idx } });
    });
  });
}
