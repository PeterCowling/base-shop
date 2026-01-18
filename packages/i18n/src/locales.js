"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locales = exports.LOCALES = void 0;
exports.assertLocales = assertLocales;
exports.resolveLocale = resolveLocale;
// packages/i18n/src/locales.ts
// Supported locales
// Source of truth comes from @acme/types/constants to keep packages consistent.
const constants_1 = require("@acme/types/constants");
exports.LOCALES = constants_1.LOCALES;
function assertLocales(value) {
    if (!Array.isArray(value) || value.length === 0) {
        // i18n-exempt: Developer-facing error message for invalid configuration, not shown to end users
        throw new Error("LOCALES must be a non-empty array");
    }
}
assertLocales(exports.LOCALES);
exports.locales = exports.LOCALES;
function resolveLocale(value) {
    return exports.locales.includes(value) ? value : "en";
}
