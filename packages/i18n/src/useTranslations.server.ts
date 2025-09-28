import type { Locale } from "./locales";

/**
 * Load translation messages for a given locale on the server and return a
 * lookup function that supports simple template variable interpolation
 * using `{var}` placeholders.
 */
export async function useTranslations(
  locale: Locale,
): Promise<(key: string, vars?: Record<string, unknown>) => string> {
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
  return (key: string, vars?: Record<string, unknown>): string => {
    const msg = messages[key] ?? key;
    if (!vars) return msg;
    return msg.replace(/\{(.*?)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(vars, name)
        ? String(vars[name])
        : match;
    });
  };
}
