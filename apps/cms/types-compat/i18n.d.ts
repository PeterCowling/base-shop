// Types-compat declarations for @acme/i18n and @acme/i18n paths

declare module "@acme/i18n" {
  export function useTranslations(): (key: string, vars?: Record<string, unknown>) => string;
  export function getTranslations(locale?: string): Promise<(key: string, vars?: Record<string, unknown>) => string>;
  export type Locale = "en" | "de" | "it" | "fr" | "es" | string;
  export const locales: Locale[];
  export const LOCALES: Locale[];
  export const defaultLocale: Locale;
  export const Translations: React.FC<any>;
  export const TranslationsProvider: React.FC<any>;
}

declare module "@acme/i18n/*" {
  const content: any;
  export = content;
}

declare module "@acme/i18n/useTranslations.server" {
  export function useTranslations(locale?: string): (key: string, vars?: Record<string, unknown>) => string;
  export function getServerTranslations(locale?: string): Promise<(key: string, vars?: Record<string, unknown>) => string>;
}

declare module "@acme/i18n" {
  export function useTranslations(): (key: string, vars?: Record<string, unknown>) => string;
  export function getTranslations(locale?: string): Promise<(key: string, vars?: Record<string, unknown>) => string>;
  export type Locale = "en" | "de" | "it" | "fr" | "es" | string;
  export const locales: Locale[];
  export const defaultLocale: Locale;
  export const Translations: React.FC<any>;
  export const TranslationsProvider: React.FC<any>;
}

declare module "@acme/i18n/*" {
  const content: any;
  export = content;
}

declare module "@acme/i18n/Translations" {
  export const Translations: React.FC<any>;
  export const TranslationsProvider: React.FC<any>;
  export function useTranslations(): (key: string, vars?: Record<string, unknown>) => string;
  export default Translations;
}

declare module "@acme/i18n/useTranslations.server" {
  export function useTranslations(locale?: string): (key: string, vars?: Record<string, unknown>) => string;
  export function getServerTranslations(locale?: string): Promise<(key: string, vars?: Record<string, unknown>) => string>;
}

declare module "@acme/i18n/en.json" {
  const translations: Record<string, string>;
  export default translations;
}

declare module "@acme/i18n/fillLocales" {
  export function fillLocales<T>(value: Record<string, T> | T | undefined, defaultValue: T): Record<string, T>;
  export default fillLocales;
}
