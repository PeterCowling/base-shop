// UI-local type override: ensure t() returns string to satisfy aria-* and titles
// This only affects the @acme/ui package compilation.
declare module "@acme/i18n" {
  import type { ReactNode } from "react";

  import type { Locale } from "@acme/i18n/locales";

  export type { Locale };
  export { default as TranslationsProvider } from "@acme/i18n/Translations";
  export function useTranslations(): (key: string, vars?: Record<string, ReactNode>) => string;
}
