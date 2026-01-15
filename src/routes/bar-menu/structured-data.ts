import { DOMAIN } from "@/config";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { JSON_LD_MIME, STRUCTURED_DATA_ID } from "./constants";
import { createBarMenuStrings, fallbackLang } from "./strings";
import { buildBarMenuStructuredData } from "./jsonld";
type ResourceBundle = {
  barMenuPage: Record<string, unknown>;
  menus: Record<string, unknown>;
};

const BAR_MENU_RESOURCES: Record<AppLanguage, ResourceBundle> = {
  ar: { barMenuPage: arBarMenuPage, menus: arMenus },
  da: { barMenuPage: daBarMenuPage, menus: daMenus },
  de: { barMenuPage: deBarMenuPage, menus: deMenus },
  en: { barMenuPage: enBarMenuPage, menus: enMenus },
  es: { barMenuPage: esBarMenuPage, menus: esMenus },
  fr: { barMenuPage: frBarMenuPage, menus: frMenus },
  hi: { barMenuPage: hiBarMenuPage, menus: hiMenus },
  hu: { barMenuPage: huBarMenuPage, menus: huMenus },
  it: { barMenuPage: itBarMenuPage, menus: itMenus },
  ja: { barMenuPage: jaBarMenuPage, menus: jaMenus },
  ko: { barMenuPage: koBarMenuPage, menus: koMenus },
  no: { barMenuPage: noBarMenuPage, menus: noMenus },
  pl: { barMenuPage: plBarMenuPage, menus: plMenus },
  pt: { barMenuPage: ptBarMenuPage, menus: ptMenus },
  ru: { barMenuPage: ruBarMenuPage, menus: ruMenus },
  sv: { barMenuPage: svBarMenuPage, menus: svMenus },
  vi: { barMenuPage: viBarMenuPage, menus: viMenus },
  zh: { barMenuPage: zhBarMenuPage, menus: zhMenus },
};

const ENGLISH_RESOURCES = BAR_MENU_RESOURCES["en"];

const getResourceString = (resource: Record<string, unknown> | undefined, key: string): string | undefined => {
  if (!resource) return undefined;
  return asString(resolveFallbackKey(resource, key));
};

const createTranslator = (
  primary?: Record<string, unknown>,
  fallback?: Record<string, unknown>,
): ((key: string) => string) => {
  return (key: string) => {
    const primaryValue = getResourceString(primary, key);
    if (typeof primaryValue === "string" && primaryValue.trim() && primaryValue !== key) {
      return primaryValue;
    }
    const fallbackValue = getResourceString(fallback, key);
    if (typeof fallbackValue === "string" && fallbackValue.trim() && fallbackValue !== key) {
      return fallbackValue;
    }
    if (typeof primaryValue === "string") return primaryValue;
    if (typeof fallbackValue === "string") return fallbackValue;
    return key;
  };
};
import { asString, resolveFallbackKey } from "@/utils/localeFallback";
import arBarMenuPage from "@/locales/ar/barMenuPage.json";
import arMenus from "@/locales/ar/menus.json";
import daBarMenuPage from "@/locales/da/barMenuPage.json";
import daMenus from "@/locales/da/menus.json";
import deBarMenuPage from "@/locales/de/barMenuPage.json";
import deMenus from "@/locales/de/menus.json";
import enBarMenuPage from "@/locales/en/barMenuPage.json";
import enMenus from "@/locales/en/menus.json";
import esBarMenuPage from "@/locales/es/barMenuPage.json";
import esMenus from "@/locales/es/menus.json";
import frBarMenuPage from "@/locales/fr/barMenuPage.json";
import frMenus from "@/locales/fr/menus.json";
import hiBarMenuPage from "@/locales/hi/barMenuPage.json";
import hiMenus from "@/locales/hi/menus.json";
import huBarMenuPage from "@/locales/hu/barMenuPage.json";
import huMenus from "@/locales/hu/menus.json";
import itBarMenuPage from "@/locales/it/barMenuPage.json";
import itMenus from "@/locales/it/menus.json";
import jaBarMenuPage from "@/locales/ja/barMenuPage.json";
import jaMenus from "@/locales/ja/menus.json";
import koBarMenuPage from "@/locales/ko/barMenuPage.json";
import koMenus from "@/locales/ko/menus.json";
import noBarMenuPage from "@/locales/no/barMenuPage.json";
import noMenus from "@/locales/no/menus.json";
import plBarMenuPage from "@/locales/pl/barMenuPage.json";
import plMenus from "@/locales/pl/menus.json";
import ptBarMenuPage from "@/locales/pt/barMenuPage.json";
import ptMenus from "@/locales/pt/menus.json";
import ruBarMenuPage from "@/locales/ru/barMenuPage.json";
import ruMenus from "@/locales/ru/menus.json";
import svBarMenuPage from "@/locales/sv/barMenuPage.json";
import svMenus from "@/locales/sv/menus.json";
import viBarMenuPage from "@/locales/vi/barMenuPage.json";
import viMenus from "@/locales/vi/menus.json";
import zhBarMenuPage from "@/locales/zh/barMenuPage.json";
import zhMenus from "@/locales/zh/menus.json";

type EnsureJsonLd = (pathname?: string) => void;

const SUPPORTED_LANG_SET = new Set<string>(i18nConfig.supportedLngs as string[]);
const LANGUAGE_SLUG_MAP = new Map<AppLanguage, string>();

for (const lang of i18nConfig.supportedLngs as AppLanguage[]) {
  LANGUAGE_SLUG_MAP.set(lang, getSlug("barMenu", lang));
}

const SLUG_VALUE_SET = new Set<string>(Array.from(LANGUAGE_SLUG_MAP.values()));
const DEFAULT_SLUG = LANGUAGE_SLUG_MAP.get("en" as AppLanguage) ?? "bar-menu";

const resolveDefaultLanguage = (): AppLanguage => {
  if (fallbackLang && SUPPORTED_LANG_SET.has(fallbackLang)) {
    return fallbackLang;
  }
  if (SUPPORTED_LANG_SET.has("en")) {
    return "en" as AppLanguage;
  }
  const [first] = i18nConfig.supportedLngs as AppLanguage[];
  return first ?? ("en" as AppLanguage);
};


export const isBarMenuPath = (pathname: string): boolean => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  const [first, second] = segments;
  if (SUPPORTED_LANG_SET.has(first)) {
    if (typeof second !== "string") return false;
    const expectedSlug = LANGUAGE_SLUG_MAP.get(first as AppLanguage) ?? DEFAULT_SLUG;
    return second === expectedSlug || second === DEFAULT_SLUG;
  }
  return SLUG_VALUE_SET.has(first) || first === DEFAULT_SLUG;
};

export const ensureBarMenuJsonLd: EnsureJsonLd = (pathnameInput) => {
  if (typeof document === "undefined") return;
  if (typeof window === "undefined" && typeof pathnameInput !== "string") return;

  const pathname =
    typeof pathnameInput === "string"
      ? pathnameInput
      : typeof window !== "undefined" && typeof window.location?.pathname === "string"
        ? window.location.pathname
        : undefined;

  if (typeof pathname !== "string" || !isBarMenuPath(pathname)) {
    return;
  }

  const maybeLang = pathname.split("/").filter(Boolean)[0];
  const lang = SUPPORTED_LANG_SET.has(maybeLang ?? "")
    ? (maybeLang as AppLanguage)
    : resolveDefaultLanguage();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-id="${STRUCTURED_DATA_ID}"]`
  );

  const resources = BAR_MENU_RESOURCES[lang] ?? ENGLISH_RESOURCES;
  const fallbackResources = ENGLISH_RESOURCES;

  const barMenuTranslate = createTranslator(resources?.barMenuPage, fallbackResources?.barMenuPage);
  const fallbackTranslate = createTranslator(fallbackResources?.barMenuPage, undefined);
  const menusTranslate = createTranslator(resources?.menus, fallbackResources?.menus);
  const { barMenuString, getSectionNote, getItemNote } = createBarMenuStrings({
    barMenuTranslate,
    fallbackTranslate,
    menusTranslate,
  });

  const origin = window?.location?.origin || DOMAIN;
  const url = `${origin}/${lang}/${getSlug("barMenu", lang)}`;
  const json = buildBarMenuStructuredData({
    barMenuString,
    getSectionNote,
    getItemNote,
    barMenuTranslate,
    fallbackTranslate,
    lang,
    url,
  });

  if (existing) {
    existing.textContent = json;
    existing.type = JSON_LD_MIME;
    existing.setAttribute("data-prehydrated", "true");
    existing.dataset.lang = lang;
    return;
  }

  const script = document.createElement("script");
  script.type = JSON_LD_MIME;
  script.setAttribute("data-id", STRUCTURED_DATA_ID);
  script.setAttribute("data-prehydrated", "true");
  script.dataset.lang = lang;
  script.textContent = json;
  (document.body ?? document.head).appendChild(script);
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ensureBarMenuJsonLd();
  window.__ensureBarMenuJsonLd = (pathname?: string) => ensureBarMenuJsonLd(pathname);
}

declare global {
  interface Window {
    __ensureBarMenuJsonLd?: EnsureJsonLd;
  }
}