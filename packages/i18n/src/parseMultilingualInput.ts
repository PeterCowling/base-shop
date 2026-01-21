// packages/i18n/src/parseMultilingualInput.ts
import type { Locale } from "./locales.js";

export interface MultilingualField {
  field: "title" | "desc";
  locale: Locale;
}

export function parseMultilingualInput(
  name: unknown,
  locales: readonly Locale[]
): MultilingualField | null {
  if (typeof name !== "string") return null;
  const parts = name.split("_");
  if (parts.length !== 2) return null;
  const [field, locale] = parts as [string, string];
  if ((field === "title" || field === "desc") && locales.includes(locale as Locale)) {
    return { field: field as "title" | "desc", locale: locale as Locale };
  }
  return null;
}

/**
 * Normalize a record of locale strings by trimming values and dropping
 * entries for unknown locales or empty strings.
 */
export default function normalizeMultilingualInput(
  input: string | Record<string, unknown>,
  locales: readonly Locale[]
): Partial<Record<Locale, string>> {
  // Start with an empty object and assert the more specific type so that
  // TypeScript doesn't expect all locale keys to be present upfront.
  const result = {} as Partial<Record<Locale, string>>;
  if (typeof input === "string") {
    const trimmed = input.trim();
    const defaultLocale = locales[0];
    if (trimmed && defaultLocale) {
      result[defaultLocale] = trimmed;
    }
    return result;
  }
  for (const locale of locales) {
    const value = input[locale];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        result[locale] = trimmed;
      }
    }
  }
  return result;
}
