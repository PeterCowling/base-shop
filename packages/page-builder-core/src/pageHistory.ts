import { pageSchema, type Page } from "@acme/types";
import { z } from "zod";

function setPatchValue<T extends object, K extends keyof T>(
  patch: Partial<T>,
  key: K,
  value: T[K],
): void {
  patch[key] = value;
}

/**
 * Compute a field-wise JSON diff between two Page objects.
 *
 * - Compares values via `JSON.stringify` to handle nested structures.
 * - Returns a patch object containing only changed fields.
 * - When `previous` is undefined, the entire `next` Page is treated as new.
 */
export function diffPage(previous: Page | undefined, next: Page): Partial<Page> {
  const patch: Partial<Page> = {};
  for (const key of Object.keys(next) as (keyof Page)[]) {
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
export function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const definedEntries = Object.entries(patch).filter(([, value]) => value !== undefined);
  return { ...base, ...(Object.fromEntries(definedEntries) as Partial<T>) };
}

export interface PageDiffEntry {
  timestamp: string;
  diff: Partial<Page>;
}

const pageSchemaObject = pageSchema as unknown as z.AnyZodObject;
const partialPageSchema =
  typeof pageSchemaObject.partial === "function"
    ? pageSchemaObject.partial()
    : z.object({}).passthrough();

const pageDiffEntrySchema: z.ZodType<PageDiffEntry> = z
  .object({
    timestamp: z.string().datetime(),
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
export function parsePageDiffHistory(input: string): PageDiffEntry[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  return trimmed
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        return undefined;
      }
    })
    .filter((value): value is unknown => value !== undefined)
    .map((value) => pageDiffEntrySchema.safeParse(value))
    .filter((result): result is z.SafeParseSuccess<PageDiffEntry> => result.success)
    .map((result) => result.data);
}
