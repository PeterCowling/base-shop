/**
 * Supported languages for the guide system.
 * Keep in sync with apps/brikette/src/i18n.config.ts.
 */
export const SUPPORTED_LANGUAGES = [
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
  "ar",
  "hi",
  "vi",
  "pl",
  "sv",
  "no",
  "da",
  "hu",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
