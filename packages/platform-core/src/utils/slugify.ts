// packages/platform-core/src/utils/slugify.ts

/** Convert a string into a URL-friendly slug. */
export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

