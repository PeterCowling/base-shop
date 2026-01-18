"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportComponents = exportComponents;
exports.exportComponentsFromHistory = exportComponentsFromHistory;
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
function exportComponents(list, editor, globals) {
    const map = editor ?? {};
    return list.map((node) => {
        const flags = map[node.id];
        const globalMeta = flags?.global;
        const globalId = globalMeta?.id;
        // Start from either the linked global template or the node itself.
        let copy = { ...node };
        if (globalId && globals && globals[globalId]) {
            // Clone template but preserve instance id.
            copy = { ...globals[globalId], id: node.id };
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
            const strategy = flags.stackStrategy;
            if (strategy === "default" || strategy === "reverse") {
                copy.stackStrategy = strategy;
            }
        }
        if (typeof flags?.orderMobile === "number") {
            copy.orderMobile = flags.orderMobile;
        }
        const childrenFromCopy = copy.children;
        const childrenFromNode = node.children;
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
function exportComponentsFromHistory(history, globals) {
    if (!history)
        return [];
    const present = Array.isArray(history.present) ? history.present : [];
    return exportComponents(present, history.editor, globals);
}
