import appI18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { LoaderFunctionArgs } from "react-router-dom";

import { GUIDE_KEY, REQUIRED_NAMESPACES } from "./constants";

import { resolveHowToRouteSlug as baseResolveHowToRouteSlug } from "../loader";

export { resolveHowToRouteSlug } from "../loader";

const FALLBACK_LANGUAGE = (i18nConfig.fallbackLng ?? "en") as AppLanguage;

const GUIDE_SLUGS = (() => {
  const supported = Array.isArray(i18nConfig.supportedLngs)
    ? (i18nConfig.supportedLngs as AppLanguage[])
    : ([] as AppLanguage[]);
  const languages = new Set<AppLanguage>([FALLBACK_LANGUAGE, ...supported]);
  const slugs = new Set<string>();
  languages.forEach((code) => {
    slugs.add(guideSlug(code, GUIDE_KEY));
  });
  return slugs;
})();

async function syncLanguage(lang: AppLanguage) {
  if (typeof appI18n.changeLanguage === "function") {
    await appI18n.changeLanguage(lang);
  } else {
    (appI18n as { language?: string }).language = lang;
  }
}

function getLanguageFromRequest(request: Request): AppLanguage {
  const detected = langFromRequest(request) as AppLanguage | undefined;
  return detected ?? FALLBACK_LANGUAGE;
}

export async function clientLoader({ params, request }: LoaderFunctionArgs) {
  const lang = getLanguageFromRequest(request);
  const slug = baseResolveHowToRouteSlug(params, request, lang);

  if (!slug || !GUIDE_SLUGS.has(slug)) {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error message
    throw new Response("Not Found", { status: 404 });
  }

  await preloadNamespacesWithFallback(lang, REQUIRED_NAMESPACES);
  // Dev-hardening: ensure the per-key guide content exists to avoid raw keys
  // during development if split bundles hydrate late.
  await ensureGuideContent(lang, GUIDE_KEY, {
    en: () => import("@/locales/en/guides/content/fornilloBeachToBrikette.json"), // i18n-exempt -- TECH-000 [ttl=2026-12-31] static import path; not user-visible copy
    ...(lang === "en"
      ? {}
      : {
          local: () =>
            import(`@/locales/${lang}/guides/content/fornilloBeachToBrikette.json`).catch(() => undefined),
        }),
  });
  await syncLanguage(lang);

  return { lang } as const;
}
