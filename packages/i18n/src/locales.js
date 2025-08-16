// packages/i18n/src/locales.ts
export const LOCALES = ["en", "de", "it"];
export function assertLocales(value) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error("LOCALES must be a non-empty array");
    }
}
assertLocales(LOCALES);
export const locales = LOCALES;
export function resolveLocale(value) {
    return locales.includes(value) ? value : "en";
}
