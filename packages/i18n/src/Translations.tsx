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

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Key–value map of translation messages.
 *
 * Each entry maps a translation key to the translated string for the
 * currently active locale. The keys are arbitrary strings defined by the
 * application and should be unique. See {@link TranslationsProvider} for
 * details on how this map is consumed.
 */
export type Messages = Record<string, ReactNode>;

/**
 * React context used to share translation messages across the component tree.
 *
 * The default value is an empty object; consumer components should always
 * access this via the `useTranslations` hook rather than directly. See
 * {@link TranslationsProvider} for details on how this context is populated.
 */
const TContext = createContext<Messages>({});

/**
 * Props for {@link TranslationsProvider}.
 */
interface TranslationsProviderProps {
  /**
   * Child components that will have access to the provided translation
   * messages via the `useTranslations` hook.
   */
  readonly children: ReactNode;
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
  const value = useMemo<Messages>(() => messages, [messages]);

  return <TContext.Provider value={value}>{children}</TContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */

// Named export for explicit imports
export { TranslationsProvider };
// Default export to support `import TranslationsProvider from "..."` syntax
export default TranslationsProvider;

/**
 * Hook that returns a memoised translation function.
 *
 * Consumers call this hook to obtain a function that resolves translation
 * keys to their corresponding messages. The returned function is memoised
 * with `useCallback` and will only be recreated when the underlying
 * messages map changes, enabling consumers to avoid unnecessary renders.
 *
 * @example
 * const t = useTranslations();
 * return <span>{t("welcome")}</span>;
 *
 * @returns A function that resolves a given key to its translated message, or
 *          the key itself if no translation exists.
 */
export function useTranslations(): (
  key: string,
  vars?: Record<string, ReactNode>
) => ReactNode {
  const messages = useContext(TContext);
  // Memoise the translation function to keep its identity stable across
  // renders unless the messages map changes. Without this memoisation,
  // consumers that store the translator function in state or pass it as a
  // prop could be triggered to re-render unnecessarily.
  return useCallback(
    (key: string, vars?: Record<string, ReactNode>): ReactNode => {
      if (messages[key] === undefined) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }

      const msg = messages[key];
      if (typeof msg === "string") {
        if (vars) {
          return msg.replace(/\{(.*?)\}/g, (match, name) => {
            return Object.prototype.hasOwnProperty.call(vars, name)
              ? String(vars[name])
              : match;
          });
        }
        return msg;
      }
      return msg;
    },
    [messages]
  );
}
