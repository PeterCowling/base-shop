import type { Locale } from "@/types/locale";

export type Messages = Record<string, string>;

export async function loadMessages(locale: Locale): Promise<Messages> {
  const base = (await import("../../i18n/en.json")).default as Messages;
  if (locale === "en") return base;
  try {
    const localized = (
      await import(
        /* webpackInclude: /(en|it|es|de)\.json$/ */
        `../../i18n/${locale}.json`
      )
    ).default as Messages;
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
