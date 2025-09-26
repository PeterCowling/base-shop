import type { Locale } from "./locales";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function.
 */
export async function useTranslations(
  _locale: Locale
): Promise<(key: string) => string> {
  const enMessages = (
    await import(
      /* webpackInclude: /en\.json$/ */
      `./en.json`
    )
  ).default as Record<string, string>;

  const localeMessages =
    // With only English enabled, always use English messages
    enMessages;

  const messages = { ...enMessages, ...localeMessages } as Record<string, string>;

  return (key: string): string => messages[key] ?? key;
}
