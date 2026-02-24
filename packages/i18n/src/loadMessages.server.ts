import type { Locale } from "./locales.js";

export type Messages = Record<string, string>;

const localeLoaders: Record<Locale, () => Promise<Messages>> = {
  en: async () =>
    (await import("./en.json", { assert: { type: "json" } })).default as Messages,
  de: async () =>
    (await import("./de.json", { assert: { type: "json" } })).default as Messages,
  it: async () =>
    (await import("./it.json", { assert: { type: "json" } })).default as Messages,
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  const enMessages = await localeLoaders.en();

  if (locale === "en") return enMessages;

  try {
    const localeMessages = await localeLoaders[locale]();
    return { ...enMessages, ...localeMessages };
  } catch {
    // If the locale file is missing at build/runtime, fall back to English
    return enMessages;
  }
}
