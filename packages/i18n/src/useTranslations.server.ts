import type { Locale } from "./locales";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function.
 */
export async function useTranslations(locale: Locale) {
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `./${locale}.json`
    )
  ).default as Record<string, string>;

  return (key: string): string => messages[key] ?? key;
}
