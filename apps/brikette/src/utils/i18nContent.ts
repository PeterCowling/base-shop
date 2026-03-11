// src/utils/i18nContent.ts
// Helpers for coercing translation payloads into predictable array shapes.

// eslint-disable-next-line security/detect-unsafe-regex -- BRIK-2145 Static pattern for validating i18n key format; no user input
export const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;
// eslint-disable-next-line security/detect-unsafe-regex -- BRIK-2145 Static pattern for validating uppercase token format; no user input
export const UPPER_I18N_KEY_TOKEN_PATTERN = /^[A-Z0-9_]+(?:\.[A-Z0-9_]+)+$/u;
// Some locales return a string when translators haven't supplied the structured
// JSON variant yet. These helpers normalise the values so rendering logic can
// safely iterate without crashing tests or runtime users.

export function ensureStringArray(value: unknown): string[] {
  // Handle common i18n object shapes like { default: [...] } by unwrapping
  // the default payload before coercing to a string array.
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v["default"]) || typeof v["default"] === "string") {
      return ensureStringArray(v["default"] as unknown);
    }
  }
  // Normalise arrays first
  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const item of value) {
      if (item == null) continue;
      if (typeof item === "string") {
        // Preserve translator-provided whitespace, but drop empty/whitespace-only strings
        if (item.trim().length === 0) continue;
        result.push(item);
        continue;
      }

      // For non-strings, stringify and trim to remove accidental blanks
      const stringified = String(item);
      const trimmed = stringified.trim();
      if (trimmed.length === 0) continue;
      result.push(trimmed);
    }
    return result;
  }

  // Handle singular values
  if (value == null) return [];

  if (typeof value === "string") {
    // Preserve whitespace if not blank; drop empty/whitespace-only strings
    if (value.trim().length === 0) return [];
    return [value];
  }

  const stringified = String(value);
  const trimmed = stringified.trim();
  if (trimmed.length === 0) return [];
  return [trimmed];
}

// Similar to ensureStringArray but keeps translator-provided whitespace for rendering contexts
// that rely on intentional spacing (e.g. sentence fragments).
const isWhitespaceOnly = (input: string): boolean => input.trim().length === 0;

const normalisePreservedValue = (input: unknown): string | undefined => {
  if (input == null) return undefined;
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean" || typeof input === "bigint") {
    const stringified = String(input);
    return isWhitespaceOnly(stringified) ? undefined : stringified;
  }
  return undefined;
};

export function ensureStringArrayPreserveWhitespace(value: unknown): string[] {
  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const item of value) {
      const candidate = normalisePreservedValue(item);
      if (candidate && !isWhitespaceOnly(candidate)) {
        result.push(candidate);
      }
    }
    return result;
  }

  const candidate = normalisePreservedValue(value);
  if (!candidate || isWhitespaceOnly(candidate)) {
    return [];
  }
  return [candidate];
}

export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Coerce an i18n translation result into a plain string, returning `fallback`
 * when the value is not a string, is empty, or looks like an unresolved i18n key.
 */
export function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}
