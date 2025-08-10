// packages/i18n/src/index.ts

export * from "./locales";
export { assertLocales, LOCALES } from "./locales";
export { default as TranslationsProvider } from "./Translations";
export { fillLocales } from "./fillLocales";
export { parseMultilingualInput, type MultilingualField } from "./parseMultilingualInput";
