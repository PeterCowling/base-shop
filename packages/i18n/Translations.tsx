// src/i18n/Translations.tsx
"use client";

import { createContext, ReactNode, useContext } from "react";

type Messages = Record<string, string>;
const TContext = createContext<Messages>({});

export function TranslationsProvider({
  children,
  messages,
}: {
  children: ReactNode;
  messages: Messages;
}) {
  return <TContext.Provider value={messages}>{children}</TContext.Provider>;
}

export function useTranslations() {
  const messages = useContext(TContext);
  return (key: string) => messages[key] ?? key;
}
