import type { PageComponent, HistoryState } from "@acme/types";
import type { EditorFlags } from "./layout/types";

export type ExportedComponent = PageComponent & {
  /** CSS-only visibility mapping at runtime */
  hiddenBreakpoints?: ("desktop" | "tablet" | "mobile")[];
  /** Custom device visibility by breakpoint id */
  hiddenDeviceIds?: string[];
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
  globals?: Record<string, PageComponent> | null,
): ExportedComponent[] {
  const map: NonNullable<HistoryState["editor"]> = editor ?? {};
  return list.map((n) => {
    const flags: EditorFlags | undefined = map[n.id];
    const globalMeta = flags?.global as { id?: string; overrides?: Record<string, unknown> } | undefined;
    const gid = globalMeta?.id;

    // Start from either the linked global template or the node itself
    let copy: ExportedComponent = { ...(n as ExportedComponent) };
    if (gid && globals && globals[gid]) {
      // Clone template but preserve instance id
      copy = { ...(globals[gid] as ExportedComponent), id: n.id } as ExportedComponent;
    }

    // Apply per-instance overrides (builder-only) at shallow level
    if (globalMeta && globalMeta.overrides && typeof globalMeta.overrides === "object") {
      Object.assign(copy, globalMeta.overrides);
    }

    // Stamp runtime flags
    if (Array.isArray(flags?.hidden) && flags!.hidden.length > 0) {
      copy.hiddenBreakpoints = [...flags!.hidden];
    }
    if (Array.isArray(flags?.hiddenDeviceIds) && flags!.hiddenDeviceIds.length > 0) {
      copy.hiddenDeviceIds = [...flags!.hiddenDeviceIds];
    }
    if (typeof flags?.stackStrategy === "string") {
      copy.stackStrategy = flags.stackStrategy as "default" | "reverse";
    }
    if (typeof flags?.orderMobile === "number") {
      copy.orderMobile = flags.orderMobile as number;
    }

    const children = ((copy as unknown as { children?: PageComponent[] }).children ?? (n as { children?: PageComponent[] }).children);
    if (Array.isArray(children)) {
      copy.children = exportComponents(children, editor, globals);
    }
    return copy;
  });
}
