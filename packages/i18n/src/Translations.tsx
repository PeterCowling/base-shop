// packages/i18n/src/Translations.tsx
"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Key–value map of translation messages.
 */
export type Messages = Record<string, string>;

/**
 * React context used to share translation messages across the component tree.
 */
const TContext = createContext<Messages>({});

/**
 * Props for {@link TranslationsProvider}.
 */
interface TranslationsProviderProps {
  readonly children: ReactNode;
  readonly messages: Messages;
}

/**
 * Provides translation messages to descendants via {@link TContext}.
 *
 * Memoises the incoming `messages` object to prevent unnecessary re-renders
 * when reference equality is stable between renders.
 */
function TranslationsProvider({
  children,
  messages,
}: TranslationsProviderProps): React.JSX.Element {
  const value = useMemo(() => messages, [messages]);

  return <TContext.Provider value={value}>{children}</TContext.Provider>;
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
  return (key: string): string => messages[key] ?? key;
}
