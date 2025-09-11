// packages/i18n/src/parseMultilingualInput.ts
import type { Locale } from "./locales";

export interface MultilingualField {
  field: "title" | "desc";
  locale: Locale;
}

export function parseMultilingualInput(
  name: unknown,
  locales: readonly Locale[]
): MultilingualField | null {
  if (typeof name !== "string") return null;
  const match = name.match(new RegExp(`^(title|desc)_(${locales.join("|")})$`));
  if (!match) return null;
  const [, field, locale] = match as [unknown, "title" | "desc", Locale];
  return { field, locale };
}

/**
 * Normalize a record of locale strings by trimming values and dropping
 * entries for unknown locales or empty strings.
 */
export default function normalizeMultilingualInput(
  input: Record<string, unknown>,
  locales: readonly Locale[]
): Partial<Record<Locale, string>> {
  // Start with an empty object and assert the more specific type so that
  // TypeScript doesn't expect all locale keys to be present upfront.
  const result = {} as Partial<Record<Locale, string>>;
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
