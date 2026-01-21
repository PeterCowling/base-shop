import type { InitOptions } from "i18next";

import { type BreakfastMenuItemKey } from "@/data/menuPricing";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import enBreakfastMenuPage from "@/locales/en/breakfastMenuPage.json";
import enMenus from "@/locales/en/menus.json";
import {
  getLocalizedFallback,
  loadLocaleFallbacks,
  type LocaleBundle,
  type LocaleModule,
} from "@/utils/localeFallback";
import { getSlug } from "@/utils/slug";
import { getWebpackContext, supportsWebpackGlob, webpackContextToRecord } from "@/utils/webpackGlob";

// i18n-exempt -- TECH-000 [ttl=2026-12-31] build-time locale discovery
const breakfastMenuLocaleModules: Record<string, LocaleModule> = supportsWebpackGlob
  ? webpackContextToRecord<LocaleModule>(
      getWebpackContext("../../locales", true, /breakfastMenuPage\\.json$/),
      { prefix: "/locales" },
    )
  : {};
const menusLocaleModules: Record<string, LocaleModule> = supportsWebpackGlob
  ? webpackContextToRecord<LocaleModule>(
      getWebpackContext("../../locales", true, /menus\\.json$/),
      { prefix: "/locales" },
    )
  : {};

const BREAKFAST_MENU_FALLBACKS = loadLocaleFallbacks(breakfastMenuLocaleModules);
BREAKFAST_MENU_FALLBACKS.en = BREAKFAST_MENU_FALLBACKS.en ?? (enBreakfastMenuPage as LocaleBundle);

const MENUS_FALLBACKS = loadLocaleFallbacks(menusLocaleModules);
MENUS_FALLBACKS.en = MENUS_FALLBACKS.en ?? (enMenus as LocaleBundle);

export const SUPPORTED_LANG_SET = new Set<string>(i18nConfig.supportedLngs as readonly string[]);

export const resolveDefaultLanguage = (): AppLanguage => {
  const fallbackOption = i18nConfig.fallbackLng as InitOptions["fallbackLng"];
  if (Array.isArray(fallbackOption)) {
    const candidate = fallbackOption.find((lng): lng is string => SUPPORTED_LANG_SET.has(lng));
    if (candidate) {
      return candidate as AppLanguage;
    }
  } else if (typeof fallbackOption === "string" && SUPPORTED_LANG_SET.has(fallbackOption)) {
    return fallbackOption as AppLanguage;
  } else if (
    typeof fallbackOption === "object" &&
    fallbackOption !== null &&
    "default" in fallbackOption
  ) {
    const defaultValue = (fallbackOption as { default?: unknown }).default;
    if (typeof defaultValue === "string" && SUPPORTED_LANG_SET.has(defaultValue)) {
      return defaultValue as AppLanguage;
    }
  }
  return "en";
};

export const BREAKFAST_MENU_SLUGS = new Set<string>(
  [...SUPPORTED_LANG_SET].map((language) => getSlug("breakfastMenu", language as AppLanguage))
);
BREAKFAST_MENU_SLUGS.add(getSlug("breakfastMenu", resolveDefaultLanguage()));

export const getBreakfastMenuStringValue = (
  lang: AppLanguage,
  key: string,
  translate: (input: string) => string
): string => {
  const raw = translate(key);
  if (raw && raw !== key) {
    return raw;
  }
  const fallback = getLocalizedFallback(lang, key, BREAKFAST_MENU_FALLBACKS);
  if (fallback) {
    return fallback;
  }
  return raw;
};

export const getMenusStringValue = (
  lang: AppLanguage,
  key: string,
  translate: (input: string) => string
): string => {
  const raw = translate(key);
  if (raw && raw !== key) {
    return raw;
  }
  const fallback = getLocalizedFallback(lang, key, MENUS_FALLBACKS);
  if (fallback) {
    return fallback;
  }
  return raw;
};

export const createBreakfastMenuStrings = (
  lang: AppLanguage,
  translateBreakfastMenu: (key: string) => string,
  translateMenus: (key: string) => string
) => {
  const breakfastMenuString = (key: string) =>
    getBreakfastMenuStringValue(lang, key, translateBreakfastMenu);
  const menusString = (key: string) => getMenusStringValue(lang, key, translateMenus);

  const getItemNote = (key: BreakfastMenuItemKey): string | undefined => {
    const localKey = `items.${key}.note` as const;
    const menusKey = `breakfast.items.${key}.note` as const;
    const local = breakfastMenuString(localKey).trim();
    if (local) {
      return local;
    }
    const fromMenus = menusString(menusKey).trim();
    return fromMenus || undefined;
  };

  return {
    breakfastMenuString,
    menusString,
    getItemNote,
  } as const;
};
