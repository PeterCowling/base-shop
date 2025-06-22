// src/i18n/Translations.tsx
"use client"; // ← add this line
import { createContext, useContext } from "react";
const TContext = createContext({});
export function TranslationsProvider({ children, messages, }) {
    return <TContext.Provider value={messages}>{children}</TContext.Provider>;
}
export function useTranslations() {
    const messages = useContext(TContext);
    return (key) => messages[key] ?? key;
}
