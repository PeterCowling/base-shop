import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { RouteContent } from "@/lib/how-to-get-here/schema";

import { loadSplitRouteModule } from "./content-modules";

const FALLBACK_LANGUAGE = (i18nConfig.fallbackLng ?? "en") as AppLanguage;

const normaliseModuleDefault = (value: unknown): RouteContent | undefined => {
  if (value && typeof value === "object") {
    return value as RouteContent;
  }
  return undefined;
};

async function loadContentForRoute(lang: string, contentKey: string): Promise<RouteContent | undefined> {
  const mod = await loadSplitRouteModule(lang, contentKey);
  if (!mod) return undefined;
  return normaliseModuleDefault((mod as { default?: unknown }).default);
}

export async function getContentForRoute(
  lang: string,
  contentKey: string,
): Promise<RouteContent> {
  const local = await loadContentForRoute(lang, contentKey);
  if (local) return local;

  if (lang !== FALLBACK_LANGUAGE) {
    const fallback = await loadContentForRoute(FALLBACK_LANGUAGE, contentKey);
    if (fallback) return fallback;
  }

  // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error message
  throw new Response("Not Found", { status: 404 });
}
