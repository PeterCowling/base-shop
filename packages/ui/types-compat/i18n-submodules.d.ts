// Types-compat declarations for @acme/i18n submodule paths

declare module "@acme/i18n/en.json" {
  const translations: Record<string, string>;
  export default translations;
}

declare module "@acme/i18n/useTranslations.server" {
  export function useTranslations(locale?: string): (key: string) => string;
  export function getServerTranslations(locale?: string): Promise<(key: string) => string>;
}

declare module "@acme/i18n/resolveText" {
  export function resolveText(
    text: unknown,
    locale: string,
    t: (key: string, vars?: Record<string, unknown>) => string
  ): string;
}
