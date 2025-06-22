// src/i18n/locales.ts
export const locales = ["en", "de", "it"];
export function resolveLocale(value) {
    return locales.includes(value) ? value : "en";
}
