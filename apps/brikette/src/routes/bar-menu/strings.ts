import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { type BarMenuItemKey } from "@/data/menuPricing";
import enBarMenuPage from "@/locales/en/barMenuPage.json";
import enMenus from "@/locales/en/menus.json";
import { asString, resolveFallbackKey } from "@/utils/localeFallback";

type Translate = (key: string) => string;

type CreateBarMenuStringsArgs = {
  barMenuTranslate: Translate;
  fallbackTranslate?: Translate;
  menusTranslate: Translate;
};

export type BarMenuStrings = ReturnType<typeof createBarMenuStrings>;

export const fallbackLang = (() => {
  const supported = new Set<string>(i18nConfig.supportedLngs as readonly string[]);
  const isSupported = (candidate: unknown): candidate is AppLanguage =>
    typeof candidate === "string" && supported.has(candidate);

  const fallback = i18nConfig.fallbackLng;
  if (Array.isArray(fallback)) {
    return fallback.find(isSupported);
  }
  if (isSupported(fallback)) {
    return fallback;
  }
  if (typeof fallback === "object" && fallback !== null && "default" in fallback) {
    const candidate = (fallback as { default?: unknown }).default;
    if (isSupported(candidate)) {
      return candidate;
    }
  }
  return undefined;
})();

const BAR_MENU_FALLBACK = enBarMenuPage as Record<string, unknown>;
const MENUS_FALLBACK = enMenus as Record<string, unknown>;

export const getBarMenuFallback = (key: string): string | undefined =>
  asString(resolveFallbackKey(BAR_MENU_FALLBACK, key));

export const getMenusFallback = (key: string): string | undefined =>
  asString(resolveFallbackKey(MENUS_FALLBACK, key));

export const getBarMenuStringValue = (
  key: string,
  translate: Translate,
  fallbackTranslate?: Translate,
): string => {
  const raw = translate(key);
  if (raw && raw !== key) {
    return raw;
  }
  const fallbackFromTranslator = fallbackTranslate?.(key);
  if (fallbackFromTranslator && fallbackFromTranslator !== key) {
    return fallbackFromTranslator;
  }
  const fallbackFromJson = getBarMenuFallback(key);
  if (fallbackFromJson) {
    return fallbackFromJson;
  }
  return raw;
};

export const getMenusStringValue = (key: string, translate: Translate): string => {
  const raw = translate(key);
  if (raw && raw !== key) {
    return raw;
  }
  const fallbackFromJson = getMenusFallback(key);
  if (fallbackFromJson) {
    return fallbackFromJson;
  }
  return raw;
};

export function createBarMenuStrings({
  barMenuTranslate,
  fallbackTranslate,
  menusTranslate,
}: CreateBarMenuStringsArgs) {
  const barMenuString = (key: string) =>
    getBarMenuStringValue(key, barMenuTranslate, fallbackTranslate);
  const menusString = (key: string) => getMenusStringValue(key, menusTranslate);

  const getSectionNote = (key: string): string | undefined => {
    const localKey = `sections.${key}.note` as const;
    const menusKey = `bar.sections.${key}.note` as const;
    const local = barMenuString(localKey);
    const fromMenus = menusString(menusKey);
    const resolved = fromMenus.trim() ? fromMenus : local;
    const trimmed = resolved.trim();
    return trimmed ? trimmed : undefined;
  };

  const getItemNote = (key: BarMenuItemKey): string | undefined => {
    const localKey = `items.${key}.note` as const;
    const menusKey = `bar.items.${key}.note` as const;
    const local = barMenuString(localKey);
    const fromMenus = menusString(menusKey);
    const resolved = fromMenus.trim() ? fromMenus : local;
    const trimmed = resolved.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    barMenuString,
    menusString,
    getSectionNote,
    getItemNote,
  } as const;
}
