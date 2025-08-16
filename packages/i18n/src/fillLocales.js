// packages/i18n/src/fillLocales.ts
import { LOCALES } from "./locales";
/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
export function fillLocales(values, fallback) {
    return LOCALES.reduce((acc, locale) => {
        acc[locale] = values?.[locale] ?? fallback;
        return acc;
    }, {});
}
