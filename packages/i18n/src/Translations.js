// packages/i18n/src/Translations.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
/**
 * React context used to share translation messages across the component tree.
 */
const TContext = createContext({});
/**
 * Provides translation messages to descendants via {@link TContext}.
 *
 * Memoises the incoming `messages` object to prevent unnecessary re-renders
 * when reference equality is stable between renders.
 */
function TranslationsProvider({ children, messages, }) {
    const value = useMemo(() => messages, [messages]);
    return _jsx(TContext.Provider, { value: value, children: children });
}
/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */
export { TranslationsProvider }; // named
export default TranslationsProvider; // default
/**
 * Hook that returns a translation function.
 *
 * @returns A function that resolves a given key to its translated message, or
 *          the key itself if no translation exists.
 */
export function useTranslations() {
    const messages = useContext(TContext);
    return (key) => messages[key] ?? key;
}
