import type { Locale } from "./locales";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function.
 */
export async function useTranslations(
  locale: Locale
): Promise<(key: string) => string> {
  const enMessages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `./en.json`
    )
  ).default as Record<string, string>;

  const localeMessages =
    locale === "en"
      ? enMessages
      : (
          await import(
            /* webpackInclude: /(en|de|it)\.json$/ */
            `./${locale}.json`
          )
        ).default;

  const messages = { ...enMessages, ...localeMessages } as Record<string, string>;

  return (key: string): string => messages[key] ?? key;
}
