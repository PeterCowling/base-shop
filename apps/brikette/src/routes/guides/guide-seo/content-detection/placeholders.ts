/**
 * Placeholder detection utilities for guide content.
 */

/**
 * Check if a string value is a placeholder (empty, matches key, or is a known placeholder phrase).
 */
export function isPlaceholderString(value: string | undefined, key: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed === key) return true;
  const normalised = trimmed.replace(/[.!?…]+$/u, "").toLowerCase();
  if (normalised === "traduzione in arrivo") return true;
  return trimmed.startsWith(`${key}.`);
}

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
