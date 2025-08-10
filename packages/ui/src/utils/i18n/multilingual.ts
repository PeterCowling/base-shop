import type { Locale } from "@platform-core/src/products";

export interface MultilingualField {
  field: "title" | "desc";
  locale: Locale;
}

export function parseMultilingualInput(
  name: string,
  locales: readonly Locale[]
): MultilingualField | null {
  const match = name.match(new RegExp(`^(title|desc)_(${locales.join("|")})$`));
  if (!match) return null;
  const [, field, locale] = match as [unknown, "title" | "desc", Locale];
  return { field, locale };
}
