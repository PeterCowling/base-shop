import type { PageComponent, HistoryState } from "@acme/types";

export type ExportedComponent = PageComponent & {
  /** CSS-only visibility mapping at runtime */
  hiddenBreakpoints?: ("desktop" | "tablet" | "mobile")[];
  /** Mobile stacking strategy class applied to container component */
  stackStrategy?: "default" | "reverse";
  /** Deterministic child order on mobile (optional) */
  orderMobile?: number;
  children?: ExportedComponent[];
};

/**
 * Merge builder editor metadata into components for storefront runtime.
 * - Copies `hidden` (per-breakpoint) from history.editor into `hiddenBreakpoints` on nodes
 * - Copies `stackStrategy` onto container nodes so renderer can apply CSS class
 * - Preserves all existing props; does not mutate the input list
 */
export function exportComponents(
  list: PageComponent[],
  editor?: HistoryState["editor"],
): ExportedComponent[] {
  const map = editor ?? {};
  return list.map((n) => {
    const copy: ExportedComponent = { ...(n as ExportedComponent) };
    const flags = map[n.id] ?? {};
    if (Array.isArray(flags.hidden) && flags.hidden.length > 0) {
      copy.hiddenBreakpoints = [...flags.hidden];
    }
    if (typeof (flags as any).stackStrategy === "string") {
      copy.stackStrategy = (flags as any).stackStrategy as "default" | "reverse";
    }
    if (typeof (flags as any).orderMobile === "number") {
      copy.orderMobile = (flags as any).orderMobile as number;
    }
    const children = (n as { children?: PageComponent[] }).children;
    if (Array.isArray(children)) {
      copy.children = exportComponents(children, editor);
    }
    return copy;
  });
}
