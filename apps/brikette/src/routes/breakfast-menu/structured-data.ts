import { DOMAIN } from "@/config";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import {
  BREAKFAST_MENU_SLUGS,
  SUPPORTED_LANG_SET,
  createBreakfastMenuStrings,
  resolveDefaultLanguage,
} from "./strings";
import { createMenuGraph } from "./menu-graph";
import { JSON_LD_MIME, STRUCTURED_DATA_ID } from "./constants";

type EnsureJsonLd = (pathname?: string) => void;

export const isBreakfastMenuPath = (pathname: string): boolean => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }
  const first = segments[0];
  const second = segments[1];
  if (!first) {
    return false;
  }
  if (SUPPORTED_LANG_SET.has(first)) {
    return typeof second === "string" && BREAKFAST_MENU_SLUGS.has(second);
  }
  return BREAKFAST_MENU_SLUGS.has(first);
};

export const ensureBreakfastMenuJsonLd: EnsureJsonLd = (pathnameInput) => {
  if (typeof document === "undefined") return;
  if (typeof window === "undefined" && typeof pathnameInput !== "string") return;
  const pathname =
    typeof pathnameInput === "string"
      ? pathnameInput
      : typeof window !== "undefined" && typeof window.location?.pathname === "string"
        ? window.location.pathname
        : undefined;
  if (typeof pathname !== "string" || !isBreakfastMenuPath(pathname)) {
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-id="${STRUCTURED_DATA_ID}"]`
  );
  const maybeLang = pathname.split("/").filter(Boolean)[0];
  const lang = SUPPORTED_LANG_SET.has(maybeLang ?? "")
    ? (maybeLang as AppLanguage)
    : resolveDefaultLanguage();

  const translateFallback = (key: string) => key;
  const { breakfastMenuString, getItemNote } = createBreakfastMenuStrings(
    lang,
    translateFallback,
    translateFallback
  );
  const origin = window.location.origin || DOMAIN;
  const url = `${origin}/${lang}/${getSlug("breakfastMenu", lang)}`;
  const graph = createMenuGraph({ lang, url, breakfastMenuString, getItemNote });
  if (existing) {
    existing.textContent = JSON.stringify(graph);
    existing.setAttribute("data-prehydrated", "true");
    existing.dataset["lang"] = lang;
    return;
  }
  const script = document.createElement("script");
  script.type = JSON_LD_MIME;
  script.setAttribute("data-id", STRUCTURED_DATA_ID);
  script.setAttribute("data-prehydrated", "true");
  script.dataset["lang"] = lang;
  script.textContent = JSON.stringify(graph);
  (document.body ?? document.head).appendChild(script);
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ensureBreakfastMenuJsonLd();
  window.__ensureBreakfastMenuJsonLd = (pathname?: string) => ensureBreakfastMenuJsonLd(pathname);
}

declare global {
  interface Window {
    __ensureBreakfastMenuJsonLd?: EnsureJsonLd;
  }
}
