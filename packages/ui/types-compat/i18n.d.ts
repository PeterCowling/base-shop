// UI-local type override: ensure t() returns string to satisfy aria-* and titles
// This only affects the @acme/ui package compilation.
declare module "@acme/i18n" {
  import type { ReactNode } from "react";
  export function useTranslations(): (key: string, vars?: Record<string, ReactNode>) => string;
}

