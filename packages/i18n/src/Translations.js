"use strict";
// packages/i18n/src/Translations.tsx
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationsProvider = TranslationsProvider;
exports.useTranslations = useTranslations;
const jsx_runtime_1 = require("react/jsx-runtime");
/*
 * This module provides a lightweight internationalisation context and hook.
 *
 * The primary export is a `TranslationsProvider` component which accepts a
 * `messages` object mapping translation keys to their translated strings and
 * makes those translations available to all descendants via React context.
 *
 * A corresponding `useTranslations` hook is provided to access a stable
 * translation function. This hook returns a memoised function that resolves
 * translation keys against the current `messages` map or falls back to the
 * key itself if no translation exists. The memoisation ensures that the
 * translation function identity remains stable across renders as long as
 * `messages` does not change, which can help prevent unnecessary re-renders
 * downstream.
 */
const react_1 = require("react");
// Provide sensible defaults for tests and environments without an explicit
// provider by falling back to English messages bundled with the package.
// This ensures components render human‑readable strings instead of raw keys
// when no TranslationsProvider is mounted.
const en_json_1 = __importDefault(require("./en.json"));
/**
 * React context used to share translation messages across the component tree.
 *
 * The default value is an empty object; consumer components should always
 * access this via the `useTranslations` hook rather than directly. See
 * {@link TranslationsProvider} for details on how this context is populated.
 */
// Default to English messages if no provider is mounted. Call sites can still
// override via <TranslationsProvider messages={...}>.
const defaultMessages = en_json_1.default;
const translatorByContent = new Map();
const translatorCache = new WeakMap();
function cacheKey(msgs) {
    const keys = Object.keys(msgs).sort();
    return keys.map((k) => `${k}:${String(msgs[k])}`).join("|");
}
const createTranslator = (msgMap) => {
    return (key, vars) => {
        const msg = (msgMap[key] ?? defaultMessages[key]);
        if (msg === undefined) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`Missing translation for key: ${key}`);
            }
            return key;
        }
        if (vars) {
            return msg.replace(/\{(.*?)\}/g, (match, name) => {
                return Object.prototype.hasOwnProperty.call(vars, name)
                    ? String(vars[name])
                    : match;
            });
        }
        return msg;
    };
};
function getTranslator(messages, key) {
    const direct = translatorCache.get(messages);
    if (direct)
        return direct;
    const cacheToken = key ?? cacheKey(messages);
    const byValue = translatorByContent.get(cacheToken);
    if (byValue) {
        translatorCache.set(messages, byValue);
        return byValue;
    }
    const built = createTranslator(messages);
    translatorCache.set(messages, built);
    translatorByContent.set(cacheToken, built);
    return built;
}
const TContext = (0, react_1.createContext)({
    messages: defaultMessages,
    translator: getTranslator(defaultMessages),
});
/**
 * Provides translation messages to descendants via {@link TContext}.
 *
 * The `messages` prop is memoised using `useMemo` to ensure that the
 * context value only changes when the actual message contents change.
 * Without this memoisation a new object reference on every render would
 * trigger context consumers even if the values are identical.
 *
 * @param props Component props containing children and a messages map
 * @returns A context provider wrapping the component tree
 */
function TranslationsProvider({ children, messages, }) {
    // Memoise the messages object so that the context value identity only
    // changes when the messages themselves change. This avoids unnecessary
    // re-renders in consumers of the context when the provider re-renders with
    // stable message contents.
    // Prefer provided messages when non-empty; otherwise fall back to English.
    // This ensures human‑readable text in environments that forget to mount
    // a provider or accidentally pass an empty map (e.g., some tests).
    const activeMessages = (0, react_1.useMemo)(() => {
        if (messages && Object.keys(messages).length > 0)
            return messages;
        return defaultMessages;
    }, [messages]);
    const messagesKey = (0, react_1.useMemo)(() => cacheKey(activeMessages), [activeMessages]);
    const value = (0, react_1.useMemo)(() => ({
        messages: activeMessages,
        translator: getTranslator(activeMessages, messagesKey),
    }), [activeMessages, messagesKey]);
    return (0, jsx_runtime_1.jsx)(TContext.Provider, { value: value, children: children });
}
// Default export to support `import TranslationsProvider from "..."` syntax
exports.default = TranslationsProvider;
function useTranslations() {
    const ctx = (0, react_1.useContext)(TContext);
    return ctx.translator;
}
