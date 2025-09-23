import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { walkTree } from "../state/layout/utils";

type Node = PageComponent & { children?: PageComponent[] };

export function applyDesktopOrderAcrossBreakpoints(
  components: PageComponent[],
  editor: HistoryState["editor"] | undefined,
  dispatch: (action: Action) => void,
): void {
  const editorMap = (editor ?? {}) as any;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const getDesktopStrategy = (parentId: string): "default" | "reverse" | "custom" => {
    const p = editorMap?.[parentId];
    const strat = (p?.["stackDesktop"] as "default" | "reverse" | "custom" | undefined);
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
        const oa = editorMap?.[a.id]?.[`order${cap("desktop")}`] as number | undefined;
        const ob = editorMap?.[b.id]?.[`order${cap("desktop")}`] as number | undefined;
        const da = oa === undefined ? Number.POSITIVE_INFINITY : oa;
        const db = ob === undefined ? Number.POSITIVE_INFINITY : ob;
        if (da === db) return a.idx - b.idx;
        return da - db;
      });
    }
    return arr.map((x) => x.id);
  };

  walkTree(components as any, (node) => {
    const kids = (node as any).children as PageComponent[] | undefined;
    if (!Array.isArray(kids) || kids.length === 0) return;
    const orderedIds = computeEffectiveDesktopOrder(node as Node);
    // Mark parent to use custom stacking on tablet/mobile
    dispatch({ type: "update-editor", id: (node as any).id, patch: { stackTablet: "custom", stackMobile: "custom" } as any });
    // Apply per-child tablet/mobile order values based on desktop order
    orderedIds.forEach((childId, idx) => {
      dispatch({ type: "update-editor", id: childId, patch: { orderTablet: idx, orderMobile: idx } as any });
    });
  });
}

