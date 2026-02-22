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

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const SUPPORTED_LANGUAGE_SET = new Set<SupportedLanguage>(SUPPORTED_LANGUAGES);

const parseExportLanguagesOverride = (
  rawValue: string | undefined,
): SupportedLanguage[] | undefined => {
  if (typeof rawValue !== "string") return undefined;

  const requested = rawValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  if (requested.length === 0) {
    throw new Error(
      "BRIKETTE_EXPORT_LOCALES is set but empty. Provide a comma-separated locale list, for example: en,es,de",
    );
  }

  const unique: SupportedLanguage[] = [];
  const invalid: string[] = [];

  for (const locale of requested) {
    if (!SUPPORTED_LANGUAGE_SET.has(locale as SupportedLanguage)) {
      invalid.push(locale);
      continue;
    }
    const typedLocale = locale as SupportedLanguage;
    if (!unique.includes(typedLocale)) unique.push(typedLocale);
  }

  if (invalid.length > 0) {
    throw new Error(
      `BRIKETTE_EXPORT_LOCALES includes unsupported locale(s): ${invalid.join(", ")}`,
    );
  }

  return unique;
};

const resolveSupportedLanguages = (): SupportedLanguage[] => {
  const isStaticExport =
    process.env.OUTPUT_EXPORT === "1" || process.env.NEXT_PUBLIC_OUTPUT_EXPORT === "1";

  if (!isStaticExport) return [...SUPPORTED_LANGUAGES];

  const exportOverride = parseExportLanguagesOverride(process.env.BRIKETTE_EXPORT_LOCALES);
  if (exportOverride && exportOverride.length > 0) return exportOverride;

  return [...SUPPORTED_LANGUAGES];
};

export const i18nConfig = {
  /** Keep this list in sync with `/src/locales/` folders. */
  supportedLngs: resolveSupportedLanguages(),
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  /** Disable null / object returns so `<Trans/>` always yields a string. */
  returnNull: false,
  returnObjects: false,
  /** React 19 no-suspense, no need to tweak here. */
} satisfies InitOptions;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
