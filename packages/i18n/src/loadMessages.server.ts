import type { Locale } from "./locales.js";

export type Messages = Record<string, string>;

export async function loadMessages(locale: Locale): Promise<Messages> {
  const enMessages = (
    await import(
      /* webpackInclude: /en\.json$/ */
      "./en.json",
      { assert: { type: "json" } }
    )
  ).default as Messages;

  if (locale === "en") return enMessages;

  try {
    const localeMessages = (
      await import(
        /* webpackInclude: /(en|de|it)\.json$/ */
        `./${locale}.json`,
        { assert: { type: "json" } }
      )
    ).default as Messages;
    return { ...enMessages, ...localeMessages };
  } catch {
    // If the locale file is missing at build/runtime, fall back to English
    return enMessages;
  }
}
