// /src/utils/slugify.ts
//
// Shared deterministic ASCII-only slug generator
//
// 1.  Normalise to NFKD so diacritics become combining marks.
// 2.  Convert all “fancy” dash characters (– — − etc.) → ASCII “-”.
// 3.  Strip combining marks (accents/umlauts).
// 4.  Replace “&” with the short word “und” (neutral, works for DE/EN tests).
// 5.  Remove every remaining character that is not alphanumeric,
//     underscore, space, or the ASCII hyphen-minus.
// 6.  Collapse whitespace / underscores → single hyphens.
// 7.  Collapse duplicate hyphens.
// 8.  Trim leading/trailing hyphens.
// 9.  Lower-case.
//
export function slugify(input: string): string {
  let s = input;

  // 1. Unicode-normalise
  s = s.normalize("NFKD");

  // 2. “fancy” dashes → ASCII hyphen-minus
  s = s.replace(/[\u2010-\u2015\u2212]/g, "-");

  // 3. Strip combining marks
  s = s.replace(/[\u0300-\u036f]/g, "");

  // 4. “&” → “und”  (better than “and” for mixed-language slugs; test expects this)
  s = s.replace(/&/g, "und");

  // 5. Drop anything that isn’t alphanumeric, space, “_”, or “-”
  s = s.replace(/[^\w\s-]/g, "");

  // 6. Whitespace / underscores → “-”
  s = s.trim().replace(/[\s_]+/g, "-");

  // 7. Collapse multiple consecutive hyphens
  s = s.replace(/-+/g, "-");

  // 8. Trim edge hyphens
  s = s.replace(/^-+|-+$/g, "");

  // 9. Lower-case
  return s.toLowerCase();
}

/**
 * Generate a slug from a localised label and fall back to the provided
 * fallback when the resulting slug would otherwise be empty
 * (e.g. when the label is only symbols or non-Latin characters).
 */
export function slugifyWithFallback(label: string, fallback: string): string {
  const slug = slugify(label);
  return slug || slugify(fallback);
}
