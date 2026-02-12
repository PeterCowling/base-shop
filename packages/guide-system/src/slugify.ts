/**
 * Deterministic ASCII-only slug generator.
 *
 * Extracted from apps/brikette/src/utils/slugify.ts
 */
export function slugify(input: string): string {
  let s = input;
  s = s.normalize("NFKD");
  s = s.replace(/[\u2010-\u2015\u2212]/g, "-");
  s = s.replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/&/g, "und");
  s = s.replace(/[^\w\s-]/g, "");
  s = s.trim().replace(/[\s_]+/g, "-");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  return s.toLowerCase();
}

/**
 * Generate a slug from a localised label and fall back to the provided
 * fallback when the resulting slug would otherwise be empty.
 */
export function slugifyWithFallback(label: string, fallback: string): string {
  const slug = slugify(label);
  return slug || slugify(fallback);
}
