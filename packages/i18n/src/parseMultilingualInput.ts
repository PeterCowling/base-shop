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
