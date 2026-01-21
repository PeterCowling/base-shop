import type { LoaderFunctionArgs } from "react-router-dom";

import appI18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

import { resolveHowToRouteSlug as baseResolveHowToRouteSlug } from "../loader";

import { GUIDE_KEY, REQUIRED_NAMESPACES } from "./constants";

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
    // Return empty body to avoid hardcoded copy in response payload
    throw new Response(null, { status: 404 });
  }

  await preloadNamespacesWithFallback(lang, REQUIRED_NAMESPACES);
  // Dev-hardening: ensure the per-key guide content exists to avoid raw keys
  // during development if split bundles hydrate late.
  await ensureGuideContent(lang, GUIDE_KEY, {
    en: () =>
      import(
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] module specifier */
        "@/locales/en/guides/content/briketteToFerryDock.json"
      ),
    ...(lang === "en"
      ? {}
      : {
          local: () =>
            import(`@/locales/${lang}/guides/content/briketteToFerryDock.json`).catch(() => undefined),
        }),
  });
  await syncLanguage(lang);

  return { lang } as const;
}
