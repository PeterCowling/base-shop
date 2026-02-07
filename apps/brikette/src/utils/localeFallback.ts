import { type AppLanguage,i18nConfig } from "@/i18n.config";

export type LocaleBundle = Record<string, unknown>;
export type LocaleModule = { default: LocaleBundle } | LocaleBundle;
// Allow lookups for unsupported languages to type to `undefined` while
// retaining strong typing for supported `AppLanguage` keys.
export type LocaleFallbackMap =
  Partial<Record<AppLanguage, LocaleBundle>> &
  Record<string, LocaleBundle | undefined>;

const LOCALE_PATH_REGEX = /\/locales\/([^/]+)\//;
const SUPPORTED_LANG_SET = new Set<string>(i18nConfig.supportedLngs as readonly string[]);

export const resolveFallbackKey = (source: LocaleBundle, key: string): unknown =>
  key.split(".").reduce<unknown>((acc, segment) => {
    if (acc == null) return undefined;
    if (Array.isArray(acc)) {
      const index = Number(segment);
      return Number.isNaN(index) ? undefined : acc[index];
    }
    if (typeof acc === "object") {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);

export const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const extractLanguageFromPath = (path: string): AppLanguage | undefined => {
  const match = path.match(LOCALE_PATH_REGEX);
  if (!match) return undefined;
  const lang = match[1];
  if (typeof lang === "string" && SUPPORTED_LANG_SET.has(lang)) {
    return lang as AppLanguage;
  }
  return undefined;
};

export const loadLocaleFallbacks = (
  modules: Record<string, LocaleModule>,
  options: {
    getLanguageFromPath?: (path: string) => AppLanguage | undefined;
  } = {},
): LocaleFallbackMap => {
  const { getLanguageFromPath = extractLanguageFromPath } = options;
  const map: LocaleFallbackMap = {};
  for (const [path, mod] of Object.entries(modules)) {
    const lang = getLanguageFromPath(path);
    if (!lang) continue;
    const candidate = (mod as { default?: LocaleBundle }).default ?? (mod as LocaleBundle);
    map[lang] = candidate;
  }
  return map;
};

export const getLocalizedFallback = (
  lang: AppLanguage,
  key: string,
  map: LocaleFallbackMap,
  options: {
    fallbackLanguages?: readonly AppLanguage[];
  } = {},
): string | undefined => {
  const fallbackLanguages = options.fallbackLanguages ?? ["en" as AppLanguage];
  const orderedLanguages: AppLanguage[] = [lang];
  for (const fallbackLang of fallbackLanguages) {
    if (!fallbackLang || orderedLanguages.includes(fallbackLang)) continue;
    orderedLanguages.push(fallbackLang);
  }

  const seen = new Set<LocaleBundle>();
  for (const candidateLang of orderedLanguages) {
    const bundle = map[candidateLang];
    if (!bundle || seen.has(bundle)) continue;
    seen.add(bundle);
    const value = asString(resolveFallbackKey(bundle, key));
    if (value) {
      return value;
    }
  }
  return undefined;
};
