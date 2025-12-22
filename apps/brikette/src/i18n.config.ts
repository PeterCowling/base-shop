// src/i18n.config.ts
//
// Central, typed i18next options
// --------------------------------------------------------------------------
import type { InitOptions } from "i18next";

const SUPPORTED_LANGUAGES = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
  /* new languages */
  "ar", // Arabic
  "hi", // Hindi
  "vi", // Vietnamese
  "pl", // Polish
  "sv", // Swedish
  "no", // Norwegian
  "da", // Danish
  "hu", // Hungarian
] as const;

export const i18nConfig = {
  /** Keep this list in sync with `/src/locales/` folders. */
  supportedLngs: [...SUPPORTED_LANGUAGES],
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  /** Disable null / object returns so `<Trans/>` always yields a string. */
  returnNull: false,
  returnObjects: false,
  /** React 19 no-suspense, no need to tweak here. */
} satisfies InitOptions;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
