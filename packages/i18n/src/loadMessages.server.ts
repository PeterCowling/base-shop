import { normalizeContentLocale } from "./locales.js";

export type Messages = Record<string, string>;

const localeLoaders: Record<string, () => Promise<Messages>> = {
  en: async () =>
    (await import("./en.json", { assert: { type: "json" } })).default as Messages,
  ar: async () =>
    (await import("./ar.json", { assert: { type: "json" } })).default as Messages,
  de: async () =>
    (await import("./de.json", { assert: { type: "json" } })).default as Messages,
  es: async () =>
    (await import("./es.json", { assert: { type: "json" } })).default as Messages,
  fr: async () =>
    (await import("./fr.json", { assert: { type: "json" } })).default as Messages,
  it: async () =>
    (await import("./it.json", { assert: { type: "json" } })).default as Messages,
  ja: async () =>
    (await import("./ja.json", { assert: { type: "json" } })).default as Messages,
  ko: async () =>
    (await import("./ko.json", { assert: { type: "json" } })).default as Messages,
};

export async function loadMessages(locale: string): Promise<Messages> {
  const enMessages = await localeLoaders.en();
  const resolvedLocale = normalizeContentLocale(locale) ?? "en";

  if (resolvedLocale === "en") return enMessages;

  try {
    const loadLocaleMessages = localeLoaders[resolvedLocale];
    if (!loadLocaleMessages) {
      return enMessages;
    }
    const localeMessages = await loadLocaleMessages();
    return { ...enMessages, ...localeMessages };
  } catch {
    // If the locale file is missing at build/runtime, fall back to English
    return enMessages;
  }
}
