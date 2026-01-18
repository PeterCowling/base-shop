"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffPage = diffPage;
exports.mergeDefined = mergeDefined;
exports.parsePageDiffHistory = parsePageDiffHistory;
const types_1 = require("@acme/types");
const zod_1 = require("zod");
function setPatchValue(patch, key, value) {
    patch[key] = value;
}
/**
 * Compute a field-wise JSON diff between two Page objects.
 *
 * - Compares values via `JSON.stringify` to handle nested structures.
 * - Returns a patch object containing only changed fields.
 * - When `previous` is undefined, the entire `next` Page is treated as new.
 */
function diffPage(previous, next) {
    const patch = {};
    for (const key of Object.keys(next)) {
        const a = previous ? JSON.stringify(previous[key]) : undefined;
        const b = JSON.stringify(next[key]);
        if (a !== b) {
            setPatchValue(patch, key, next[key]);
        }
    }
    return patch;
}
/**
 * Merge a partial patch into a base object, ignoring `undefined` values.
 *
 * This keeps existing values when a field is omitted or explicitly set
 * to `undefined` in the patch, matching the behaviour used by the
 * page repositories when applying updates.
 */
function mergeDefined(base, patch) {
    const definedEntries = Object.entries(patch).filter(([, value]) => value !== undefined);
    return { ...base, ...Object.fromEntries(definedEntries) };
}
const pageSchemaObject = types_1.pageSchema;
const partialPageSchema = typeof pageSchemaObject.partial === "function"
    ? pageSchemaObject.partial()
    : zod_1.z.object({}).passthrough();
const pageDiffEntrySchema = zod_1.z
    .object({
    timestamp: zod_1.z.string().datetime(),
    diff: partialPageSchema,
})
    .strict();
/**
 * Parse a newline-delimited Page diff history log.
 *
 * Each non-empty line must be a JSON object `{ timestamp, diff }`
 * where `diff` is a partial `Page` validated against `pageSchema`.
 * Malformed lines are skipped.
 */
function parsePageDiffHistory(input) {
    const trimmed = input.trim();
    if (!trimmed)
        return [];
    return trimmed
        .split(/\n+/)
        .filter(Boolean)
        .map((line) => {
        try {
            return JSON.parse(line);
        }
        catch {
            return undefined;
        }
    })
        .filter((value) => value !== undefined)
        .map((value) => pageDiffEntrySchema.safeParse(value))
        .filter((result) => result.success)
        .map((result) => result.data);
}
