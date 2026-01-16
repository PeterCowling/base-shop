// packages/i18n/src/fillLocales.ts
import { LOCALES, type Locale } from "./locales";

/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
export function fillLocales(
  values: Partial<Record<Locale, string>> | undefined,
  fallback: string
): Record<Locale, string> {
  return LOCALES.reduce<Record<Locale, string>>(
    (acc: Record<Locale, string>, locale: Locale) => {
      acc[locale] = values?.[locale] ?? fallback;
      return acc;
    },
    {} as Record<Locale, string>
  );
}
