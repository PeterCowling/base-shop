// packages/i18n/src/Translations.tsx
"use client";

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

import { createContext, useContext, useMemo } from "react";

// Provide sensible defaults for tests and environments without an explicit
// provider by falling back to English messages bundled with the package.
// This ensures components render human‑readable strings instead of raw keys
// when no TranslationsProvider is mounted.
import enMessages from "./en.json" assert { type: "json" };

/**
 * Key–value map of translation messages.
 *
 * Each entry maps a translation key to the translated string for the
 * currently active locale. The keys are arbitrary strings defined by the
 * application and should be unique. See {@link TranslationsProvider} for
 * details on how this map is consumed.
 */
export type Messages = Record<string, string>;
type Translator = (key: string, vars?: Record<string, string | number>) => string;
type TranslationContextValue = {
  messages: Messages;
  translator: Translator;
};

/**
 * React context used to share translation messages across the component tree.
 *
 * The default value is an empty object; consumer components should always
 * access this via the `useTranslations` hook rather than directly. See
 * {@link TranslationsProvider} for details on how this context is populated.
 */
// Default to English messages if no provider is mounted. Call sites can still
// override via <TranslationsProvider messages={...}>.
const defaultMessages: Messages = enMessages as unknown as Messages;
const translatorByContent = new Map<string, Translator>();
const translatorCache = new WeakMap<Messages, Translator>();

function cacheKey(msgs: Messages): string {
  const keys = Object.keys(msgs).sort();
  return keys.map((k) => `${k}:${String(msgs[k])}`).join("|");
}

const createTranslator = (msgMap: Messages): Translator => {
  return (key: string, vars?: Record<string, string | number>): string => {
    const msg = (msgMap[key] ?? defaultMessages[key]) as string | undefined;
    if (msg === undefined) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation for key: ${key}`);
      }
      return key;
    }

    if (vars) {
      return msg.replace(/\{(.*?)\}/g, (match, name) => {
        return Object.prototype.hasOwnProperty.call(vars, name)
          ? String(vars[name] as string | number)
          : match;
      });
    }
    return msg;
  };
};

function getTranslator(messages: Messages, key?: string): Translator {
  const direct = translatorCache.get(messages);
  if (direct) return direct;

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

const TContext = createContext<TranslationContextValue>({
  messages: defaultMessages,
  translator: getTranslator(defaultMessages),
});

/**
 * Props for {@link TranslationsProvider}.
 */
interface TranslationsProviderProps {
  /**
   * Child components that will have access to the provided translation
   * messages via the `useTranslations` hook.
   */
  readonly children: React.ReactNode;
  /**
   * A map of translation keys to translated strings. When this object
   * reference changes a new context value will be provided to descendants.
   */
  readonly messages: Messages;
}

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
function TranslationsProvider({
  children,
  messages,
}: TranslationsProviderProps): React.JSX.Element {
  // Memoise the messages object so that the context value identity only
  // changes when the messages themselves change. This avoids unnecessary
  // re-renders in consumers of the context when the provider re-renders with
  // stable message contents.
  // Prefer provided messages when non-empty; otherwise fall back to English.
  // This ensures human‑readable text in environments that forget to mount
  // a provider or accidentally pass an empty map (e.g., some tests).
  const activeMessages = useMemo<Messages>(() => {
    if (messages && Object.keys(messages).length > 0) return messages;
    return defaultMessages;
  }, [messages]);

  const messagesKey = useMemo(() => cacheKey(activeMessages), [activeMessages]);

  const value = useMemo<TranslationContextValue>(
    () => ({
      messages: activeMessages,
      translator: getTranslator(activeMessages, messagesKey),
    }),
    [activeMessages, messagesKey]
  );

  return <TContext.Provider value={value}>{children}</TContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */

// Named export for explicit imports
export { TranslationsProvider };
// Default export to support `import TranslationsProvider from "..."` syntax
export default TranslationsProvider;

export function useTranslations(): (
  key: string,
  vars?: Record<string, string | number>
) => string {
  const ctx = useContext(TContext);
  return ctx.translator;
}
