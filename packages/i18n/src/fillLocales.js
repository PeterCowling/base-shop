"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillLocales = fillLocales;
// packages/i18n/src/fillLocales.ts
const locales_1 = require("./locales");
/**
 * Ensure all locales have a value, filling in missing entries with a fallback.
 */
function fillLocales(values, fallback) {
    return locales_1.LOCALES.reduce((acc, locale) => {
        acc[locale] = values?.[locale] ?? fallback;
        return acc;
    }, {});
}
