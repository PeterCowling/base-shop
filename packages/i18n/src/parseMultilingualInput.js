"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultilingualInput = parseMultilingualInput;
exports.default = normalizeMultilingualInput;
function parseMultilingualInput(name, locales) {
    if (typeof name !== "string")
        return null;
    const parts = name.split("_");
    if (parts.length !== 2)
        return null;
    const [field, locale] = parts;
    if ((field === "title" || field === "desc") && locales.includes(locale)) {
        return { field: field, locale: locale };
    }
    return null;
}
/**
 * Normalize a record of locale strings by trimming values and dropping
 * entries for unknown locales or empty strings.
 */
function normalizeMultilingualInput(input, locales) {
    // Start with an empty object and assert the more specific type so that
    // TypeScript doesn't expect all locale keys to be present upfront.
    const result = {};
    if (typeof input === "string") {
        const trimmed = input.trim();
        const defaultLocale = locales[0];
        if (trimmed && defaultLocale) {
            result[defaultLocale] = trimmed;
        }
        return result;
    }
    for (const locale of locales) {
        const value = input[locale];
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed) {
                result[locale] = trimmed;
            }
        }
    }
    return result;
}
