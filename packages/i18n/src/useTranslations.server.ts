import type { Locale } from "./locales";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function.
 */
export async function useTranslations(locale: Locale): Promise<(key: string) => string> {
  const enMessages = (
    await import(
      /* webpackInclude: /en\.json$/ */
      `./en.json`
    )
  ).default as Record<string, string>;

  let localeMessages: Record<string, string> = {};
  try {
    if (locale !== "en") {
      localeMessages = (
        await import(
          /* webpackInclude: /(en|de|it)\.json$/ */
          `./${locale}.json`
        )
      ).default as Record<string, string>;
    }
  } catch {
    // If the locale file is missing at build/runtime, fall back to English
    localeMessages = {};
  }

  const messages = { ...enMessages, ...localeMessages } as Record<string, string>;
  return (key: string): string => messages[key] ?? key;
}
