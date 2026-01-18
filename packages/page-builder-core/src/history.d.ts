import type { HistoryState, PageComponent } from "@acme/types";
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
export declare function commit(state: HistoryState, next: PageComponent[]): HistoryState;
/**
 * Undo the last committed change in history.
 *
 * - Moves the latest entry from `past` into `present`.
 * - Pushes the previous `present` stack onto the front of `future`.
 * - Preserves `gridCols` and any `editor` metadata.
 * - Returns the original state when `past` is empty.
 */
export declare function undo(state: HistoryState): HistoryState;
/**
 * Redo the next change in history.
 *
 * - Moves the first entry from `future` into `present`.
 * - Appends the previous `present` stack to `past`.
 * - Preserves `gridCols` and any `editor` metadata.
 * - Returns the original state when `future` is empty.
 */
export declare function redo(state: HistoryState): HistoryState;
