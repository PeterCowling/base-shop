import type { Locale } from "@/types/locale";

export type Messages = Record<string, string>;

const localeMessagesLoaders: { en: () => Promise<Messages> } &
  Partial<Record<Locale, () => Promise<Messages>>> = {
  en: async () => (await import("../../i18n/en.json")).default as Messages,
  it: async () => (await import("../../i18n/it.json")).default as Messages,
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  const base = await localeMessagesLoaders.en();
  if (locale === "en") return base;
  try {
    const loadLocalized = localeMessagesLoaders[locale] ?? localeMessagesLoaders.en;
    if (!loadLocalized) return base;
    const localized = await loadLocalized();
    return { ...base, ...localized };
  } catch {
    return base;
  }
}

export function createTranslator(messages: Messages) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const template = messages[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(.*?)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(vars, name)
        ? String(vars[name])
        : match;
    });
  };
}
