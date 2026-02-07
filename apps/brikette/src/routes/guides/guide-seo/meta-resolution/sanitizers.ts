/**
 * Sanitization utilities for meta values.
 */

/**
 * Sanitize a meta title value.
 * Returns null if the value is empty, matches the key, or contains placeholder text.
 */
export function sanitizeMetaTitle(value: unknown, expectedKey: string, metaKey: string): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed === expectedKey) return null;
  const lower = trimmed.toLowerCase();
  if (lower === metaKey.toLowerCase()) return null;
  if (lower.includes("meta")) return null;
  return trimmed;
}

/**
 * Check if a string value is meaningful (not empty, not a placeholder).
 */
export function isMeaningfulString(value: unknown, key: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== key;
}

/**
 * Convert a candidate value to a valid string or null.
 * Handles placeholder detection and disallowed values.
 */
export function toCandidate(
  value: unknown,
  placeholder: string,
  options: {
    disallowed?: string[];
    allowEnglishFallback?: boolean;
    englishFallbacks?: Set<string>;
    additionalPlaceholders?: string[];
  } = {},
): string | null {
  const {
    disallowed = [],
    allowEnglishFallback = true,
    englishFallbacks = new Set<string>(),
    additionalPlaceholders = [],
  } = options;

  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed === placeholder) return null;
  if (trimmed.startsWith("［Stub］")) return null;

  for (const p of additionalPlaceholders) {
    if (trimmed === p) return null;
  }

  if (disallowed.some((entry) => trimmed.toLowerCase() === entry.toLowerCase())) {
    return null;
  }

  if (!allowEnglishFallback && englishFallbacks.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}
