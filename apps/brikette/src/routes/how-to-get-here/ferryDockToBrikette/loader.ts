import appI18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { SUPPORTED_LANGUAGES } from "@/config";
import { guideSlug } from "@/routes.guides-helpers";
import { GUIDE_SLUGS } from "@/guide-slug-map";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { LoaderFunctionArgs } from "react-router-dom";

import { GUIDE_KEY, REQUIRED_NAMESPACES } from "./constants";

import { resolveHowToRouteSlug as baseResolveHowToRouteSlug } from "../loader";

export { resolveHowToRouteSlug } from "../loader";

const FALLBACK_LANGUAGE = (i18nConfig.fallbackLng ?? "en") as AppLanguage;

function isValidGuideSlug(slug: string, lang: AppLanguage): boolean {
  // Accept the slug for the detected language and the fallback language.
  // This avoids mismatch when module-level sets are initialised before
  // test-time i18n config mocks are applied.
  const current = guideSlug(lang, GUIDE_KEY);
  const fallback = guideSlug(FALLBACK_LANGUAGE, GUIDE_KEY);
  if (slug === current || slug === fallback) return true;

  // As a final safety net, also accept any slug for configured supported
  // languages at call time (handles dynamic supportedLngs in tests).
  const fromConfig = Array.isArray(i18nConfig.supportedLngs)
    ? (i18nConfig.supportedLngs as AppLanguage[])
    : ([] as AppLanguage[]);
  // Union with runtime-supported languages to tolerate test-time module reloads
  // where different imports may observe different i18n config snapshots.
  const fromRuntime = SUPPORTED_LANGUAGES as readonly AppLanguage[];
  const supported = new Set<AppLanguage>([...fromConfig, ...fromRuntime]);
  for (const code of supported) {
    if (slug === guideSlug(code, GUIDE_KEY)) return true;
  }

  // Extra resilience: accept any slug present in the statically generated
  // dictionary for this guide across all languages. This guards against
  // rare module‑timing variations during tests where different imports may
  // observe different supportedLngs snapshots.
  const perLang = GUIDE_SLUGS[GUIDE_KEY as keyof typeof GUIDE_SLUGS] as
    | Record<string, string>
    | undefined;
  if (perLang) {
    for (const value of Object.values(perLang)) {
      if (slug === value) return true;
    }
  }
  return false;
}

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

  if (!slug || !isValidGuideSlug(slug, lang)) {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error message
    throw new Response("Not Found", { status: 404 });
  }

  await preloadNamespacesWithFallback(lang, REQUIRED_NAMESPACES);
  // Dev-hardening: ensure the per-key guide content exists to avoid raw keys
  // during development if split bundles hydrate late.
  await ensureGuideContent(lang, GUIDE_KEY, {
    en: () => import("@/locales/en/guides/content/ferryDockToBrikette.json"), // i18n-exempt -- TECH-000 [ttl=2026-12-31] static import path; not user-visible copy
    ...(lang === "en"
      ? {}
      : {
          local: () =>
            import(`@/locales/${lang}/guides/content/ferryDockToBrikette.json`).catch(() => undefined),
        }),
  });
  await syncLanguage(lang);

  return { lang } as const;
}
