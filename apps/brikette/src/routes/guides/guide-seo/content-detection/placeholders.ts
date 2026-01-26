/**
 * Placeholder detection utilities for guide content.
 *
 * For the complete list of placeholder phrases and translation workflow,
 * see: apps/brikette/docs/guide-translation-workflow.md
 *
 * Related plans:
 * - Translation coverage: docs/plans/brikette-translation-coverage-plan.md
 * - DX improvements: docs/plans/guide-translation-dx-improvements-plan.md
 */

/**
 * Known placeholder phrases by locale. These are strings that indicate
 * "translation in progress" rather than actual translated content.
 */
const PLACEHOLDER_PHRASES = [
  "traduzione in arrivo", // Italian
  "tłumaczenie w przygotowaniu", // Polish
  "a fordítás folyamatban van", // Hungarian
  "translation in progress", // English fallback
  "traducción en progreso", // Spanish
  "traduction en cours", // French
  "übersetzung in arbeit", // German
  "翻訳準備中", // Japanese
  "번역 준비 중", // Korean
  "翻译进行中", // Chinese (Simplified)
  "tradução em andamento", // Portuguese
  "перевод в процессе", // Russian
] as const;

/**
 * Check if a string value is a placeholder (empty, matches key, or is a known placeholder phrase).
 */
export function isPlaceholderString(value: string | undefined, key: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed === key) return true;
  const normalised = trimmed.replace(/[.!?…]+$/u, "").toLowerCase();
  if (PLACEHOLDER_PHRASES.some((phrase) => normalised === phrase)) return true;
  return trimmed.startsWith(`${key}.`);
}

/** Exported for testing */
export { PLACEHOLDER_PHRASES };

/**
 * Filter placeholder strings from an array.
 */
export function filterPlaceholders(arr: string[], key: string): string[] {
  try {
    return arr
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0 && !isPlaceholderString(v, key));
  } catch {
    return arr.filter((v) => typeof v === "string" && v.trim().length > 0);
  }
}
