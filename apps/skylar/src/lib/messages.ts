import en from "../../i18n/en.json";
import it from "../../i18n/it.json";
import zh from "../../i18n/zh.json";

import { DEFAULT_LOCALE, type Locale, resolveLocale } from "./locales";

const localeMessages: Record<Locale, Record<string, string>> = {
  en,
  it,
  zh,
};

export function getMessages(locale: Locale): Record<string, string> {
  return localeMessages[locale] ?? localeMessages[DEFAULT_LOCALE];
}

export function createTranslator(messages: Record<string, string>) {
  return (key: string, vars?: Record<string, string | number>) => {
    const raw = messages[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(.*?)\}/g, (_, name) =>
      Object.prototype.hasOwnProperty.call(vars, name)
        ? String(vars[name])
        : _
    );
  };
}

export function getTranslatorForLocale(locale?: string | string[]) {
  const lang = resolveLocale(locale);
  return createTranslator(getMessages(lang));
}
