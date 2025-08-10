// packages/platform-core/src/utils/string.ts
import { LOCALES } from "@i18n/locales";
import type { Locale } from "@types";

/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
export function fillLocales(
  values: Partial<Record<Locale, string>> | undefined,
  fallback: string
): Record<Locale, string> {
  return LOCALES.reduce<Record<Locale, string>>(
    (acc, locale: Locale) => {
      acc[locale] = values?.[locale] ?? fallback;
      return acc;
    },
    {} as Record<Locale, string>
  );
}

