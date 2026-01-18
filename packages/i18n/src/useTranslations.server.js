"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslations = useTranslations;
/**
 * Load translation messages for a given locale on the server and return a
 * lookup function that supports simple template variable interpolation
 * using `{var}` placeholders.
 */
async function useTranslations(locale) {
    const enMessages = (await Promise.resolve().then(() => __importStar(require(
    /* webpackInclude: /en\.json$/ */
    `./en.json`)))).default;
    let localeMessages = {};
    try {
        if (locale !== "en") {
            localeMessages = (await Promise.resolve(`${
            /* webpackInclude: /(en|de|it)\.json$/ */
            `./${locale}.json`}`).then(s => __importStar(require(s)))).default;
        }
    }
    catch {
        // If the locale file is missing at build/runtime, fall back to English
        localeMessages = {};
    }
    const messages = { ...enMessages, ...localeMessages };
    return (key, vars) => {
        const msg = messages[key] ?? key;
        if (!vars)
            return msg;
        return msg.replace(/\{(.*?)\}/g, (match, name) => {
            return Object.prototype.hasOwnProperty.call(vars, name)
                ? String(vars[name])
                : match;
        });
    };
}
