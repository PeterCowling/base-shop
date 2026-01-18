"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveText = resolveText;
const fallbackChain_1 = require("./fallbackChain");
/**
 * Resolve a translatable value for the given locale.
 * - Legacy string → treat as inline { en: legacy }.
 * - KeyRef → t(key, params).
 * - Inline → try value[locale], else walk fallback chain, else "".
 *
 * In development, logs a warning when falling back or missing.
 */
function resolveText(value, locale, t) {
    // Legacy: if value is a plain string, treat as inline with English default
    if (typeof value === "string") {
        if (process.env.NODE_ENV === "development") {
            // i18n-exempt -- INTL-203: developer-only log message
            console.warn("resolveText: legacy string used; treating as inline.en");
        }
        return value;
    }
    if (value?.type === "key") {
        return t(value.key, value.params);
    }
    if (value?.type === "inline") {
        const chain = (0, fallbackChain_1.fallbackChain)(locale);
        for (const loc of chain) {
            const v = value.value?.[loc];
            if (typeof v === "string" && v.length > 0)
                return v;
        }
        if (process.env.NODE_ENV === "development") {
            // i18n-exempt -- INTL-203: developer-only log message
            console.warn("resolveText: missing inline value across fallbacks", {
                locale,
                chain,
            });
        }
        return "";
    }
    if (process.env.NODE_ENV === "development") {
        // i18n-exempt -- INTL-203: developer-only log message
        console.warn("resolveText: unknown value shape; returning empty string", value);
    }
    return "";
}
