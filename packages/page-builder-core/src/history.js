"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commit = commit;
exports.undo = undo;
exports.redo = redo;
/**
 * Commit helper used by layout actions to update history.
 *
 * - Appends the current `present` stack to `past`.
 * - Replaces `present` with the provided `next` components.
 * - Clears the `future` stack.
 * - Preserves `gridCols` and any `editor` metadata.
 * - Returns the original state when `next` is the same reference
 *   as the current `present` stack to avoid unnecessary churn.
 */
function commit(state, next) {
    if (next === state.present)
        return state;
    return {
        past: [...state.past, state.present],
        present: next,
        future: [],
        gridCols: state.gridCols,
        ...(state.editor !== undefined ? { editor: state.editor } : {}),
    };
}
/**
 * Undo the last committed change in history.
 *
 * - Moves the latest entry from `past` into `present`.
 * - Pushes the previous `present` stack onto the front of `future`.
 * - Preserves `gridCols` and any `editor` metadata.
 * - Returns the original state when `past` is empty.
 */
function undo(state) {
    const previous = state.past.at(-1);
    if (!previous)
        return state;
    return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        gridCols: state.gridCols,
        ...(state.editor !== undefined ? { editor: state.editor } : {}),
    };
}
/**
 * Redo the next change in history.
 *
 * - Moves the first entry from `future` into `present`.
 * - Appends the previous `present` stack to `past`.
 * - Preserves `gridCols` and any `editor` metadata.
 * - Returns the original state when `future` is empty.
 */
function redo(state) {
    const next = state.future[0];
    if (!next)
        return state;
    return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        gridCols: state.gridCols,
        ...(state.editor !== undefined ? { editor: state.editor } : {}),
    };
}
