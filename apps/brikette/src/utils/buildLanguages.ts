import { type AppLanguage, i18nConfig } from "@/i18n.config";

function isAppLanguage(value: string): value is AppLanguage {
  return i18nConfig.supportedLngs.includes(value as AppLanguage);
}

const DEFAULT_BUILD_LANGUAGES = Object.freeze(i18nConfig.supportedLngs.filter(isAppLanguage));

export function parseBuildLanguages(requestedLanguages?: string | null): AppLanguage[] {
  if (!requestedLanguages?.trim()) {
    return [...DEFAULT_BUILD_LANGUAGES];
  }

  const filteredLanguages = Array.from(
    new Set(
      requestedLanguages
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .filter(isAppLanguage),
    ),
  );

  return filteredLanguages.length ? filteredLanguages : [...DEFAULT_BUILD_LANGUAGES];
}

export function getPublicBuildLanguages(): AppLanguage[] {
  return parseBuildLanguages(process.env.NEXT_PUBLIC_BRIKETTE_BUILD_LANGS);
}

export function getServerBuildLanguages(): AppLanguage[] {
  return parseBuildLanguages(
    process.env.BRIKETTE_STAGING_LANGS ?? process.env.NEXT_PUBLIC_BRIKETTE_BUILD_LANGS,
  );
}
