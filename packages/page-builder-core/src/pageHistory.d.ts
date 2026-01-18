import { type Page } from "@acme/types";
/**
 * Compute a field-wise JSON diff between two Page objects.
 *
 * - Compares values via `JSON.stringify` to handle nested structures.
 * - Returns a patch object containing only changed fields.
 * - When `previous` is undefined, the entire `next` Page is treated as new.
 */
export declare function diffPage(previous: Page | undefined, next: Page): Partial<Page>;
/**
 * Merge a partial patch into a base object, ignoring `undefined` values.
 *
 * This keeps existing values when a field is omitted or explicitly set
 * to `undefined` in the patch, matching the behaviour used by the
 * page repositories when applying updates.
 */
export declare function mergeDefined<T extends object>(base: T, patch: Partial<T>): T;
export interface PageDiffEntry {
    timestamp: string;
    diff: Partial<Page>;
}
/**
 * Parse a newline-delimited Page diff history log.
 *
 * Each non-empty line must be a JSON object `{ timestamp, diff }`
 * where `diff` is a partial `Page` validated against `pageSchema`.
 * Malformed lines are skipped.
 */
export declare function parsePageDiffHistory(input: string): PageDiffEntry[];
