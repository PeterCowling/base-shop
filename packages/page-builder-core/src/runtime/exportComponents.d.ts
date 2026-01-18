import type { HistoryState, PageComponent } from "@acme/types";
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
export declare function exportComponents(list: PageComponent[], editor?: HistoryState["editor"], globals?: Record<string, PageComponent> | null): ExportedComponent[];
/**
 * Convenience helper: export runtime-ready components from a full HistoryState.
 *
 * - Uses `history.present` as the source of truth when available.
 * - Falls back to an empty list when history is absent.
 */
export declare function exportComponentsFromHistory(history: HistoryState | null | undefined, globals?: Record<string, PageComponent> | null): ExportedComponent[];
