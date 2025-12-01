import type { HistoryState, PageComponent } from "@acme/types";
import type { EditorFlags } from "@acme/types/page/page";

export type ExportedComponent = PageComponent & {
  /**
   * CSS-only visibility mapping at runtime.
   * Stamped from editor metadata so runtimes can drive `pb-hide-*` classes
   * without depending on the full HistoryState shape.
   */
  hiddenBreakpoints?: ("desktop" | "tablet" | "mobile")[];
  /** Custom device visibility by breakpoint id (page-defined breakpoints). */
  hiddenDeviceIds?: string[];
  /** Mobile stacking strategy class applied to container component. */
  stackStrategy?: "default" | "reverse";
  /** Deterministic child order on mobile (optional). */
  orderMobile?: number;
  children?: ExportedComponent[];
};

/**
 * Merge builder editor metadata into components for storefront/runtime.
 *
 * Responsibilities:
 * - Copies `hidden` (per-viewport) from history.editor into `hiddenBreakpoints` on nodes.
 * - Copies `hiddenDeviceIds` for custom devices.
 * - Copies `stackStrategy` and `orderMobile` so renderers can apply layout classes.
 * - Optionally resolves linked "global" components when a globals map is provided.
 * - Preserves all existing props; does not mutate the input list.
 */
export function exportComponents(
  list: PageComponent[],
  editor?: HistoryState["editor"],
  globals?: Record<string, PageComponent> | null,
): ExportedComponent[] {
  const map: NonNullable<HistoryState["editor"]> = editor ?? {};

  return list.map((node) => {
    const flags: EditorFlags | undefined = map[node.id];
    const globalMeta = flags?.global as { id?: string; overrides?: Record<string, unknown> } | undefined;
    const globalId = globalMeta?.id;

    // Start from either the linked global template or the node itself.
    let copy: ExportedComponent = { ...(node as ExportedComponent) };
    if (globalId && globals && globals[globalId]) {
      // Clone template but preserve instance id.
      copy = { ...(globals[globalId] as ExportedComponent), id: node.id } as ExportedComponent;
    }

    // Apply per-instance overrides (builder-only) at shallow level.
    if (globalMeta && globalMeta.overrides && typeof globalMeta.overrides === "object") {
      Object.assign(copy, globalMeta.overrides);
    }

    // Stamp runtime flags.
    if (Array.isArray(flags?.hidden) && flags.hidden.length > 0) {
      copy.hiddenBreakpoints = [...flags.hidden];
    }
    if (Array.isArray(flags?.hiddenDeviceIds) && flags.hiddenDeviceIds.length > 0) {
      copy.hiddenDeviceIds = [...flags.hiddenDeviceIds];
    }

    // For runtime we only care about the effective mobile stacking behaviour.
    if (typeof flags?.stackStrategy === "string") {
      const strategy = flags.stackStrategy as EditorFlags["stackStrategy"];
      if (strategy === "default" || strategy === "reverse") {
        copy.stackStrategy = strategy;
      }
    }
    if (typeof flags?.orderMobile === "number") {
      copy.orderMobile = flags.orderMobile as number;
    }

    const childrenFromCopy = (copy as unknown as { children?: PageComponent[] }).children;
    const childrenFromNode = (node as unknown as { children?: PageComponent[] }).children;
    const children = childrenFromCopy ?? childrenFromNode;

    if (Array.isArray(children)) {
      copy.children = exportComponents(children, editor, globals);
    }

    return copy;
  });
}

/**
 * Convenience helper: export runtime-ready components from a full HistoryState.
 *
 * - Uses `history.present` as the source of truth when available.
 * - Falls back to an empty list when history is absent.
 */
export function exportComponentsFromHistory(
  history: HistoryState | null | undefined,
  globals?: Record<string, PageComponent> | null,
): ExportedComponent[] {
  if (!history) return [];
  const present = Array.isArray(history.present) ? (history.present as PageComponent[]) : [];
  return exportComponents(present, history.editor, globals);
}

