// packages/i18n/src/index.ts

export * from "./locales.js";
export { assertLocales, LOCALES } from "./locales.js";
export {
  default as TranslationsProvider,
  useTranslations,
} from "./Translations.js";
export { fillLocales } from "./fillLocales.js";
export {
  parseMultilingualInput,
  type MultilingualField,
} from "./parseMultilingualInput.js";
