import { notFound, permanentRedirect } from "next/navigation";

import { generateLangParams } from "@/app/_lib/static-params";
import { GUIDES_INDEX, isGuideLive } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guidePath, guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";

const LIVE_GUIDE_KEYS = GUIDES_INDEX.filter((guide) => guide.status === "live").map((guide) => guide.key);
const IS_STATIC_EXPORT_BUILD =
  process.env.OUTPUT_EXPORT === "1" || process.env.NEXT_PUBLIC_OUTPUT_EXPORT === "1";

function normalizeGuideSlug(slug: string): string {
  if (!slug) return "";

  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();

  return decoded.trim().replace(/^\/+/u, "").replace(/\/+$/u, "");
}

function resolveLegacyGuideKey(slug: string, lang: AppLanguage): GuideKey | undefined {
  const normalizedSlug = normalizeGuideSlug(slug);
  if (!normalizedSlug) return undefined;

  return resolveGuideKeyFromSlug(normalizedSlug, lang) ?? resolveGuideKeyFromSlug(normalizedSlug, "en");
}

export function generateLegacyGuideAliasStaticParams(): Array<{ lang: string; slug: string }> {
  // Static-export deploys on Pages free tier hit file-count limits if we pre-render
  // full legacy alias trees. Keep these aliases for dynamic/Worker runtime only.
  if (IS_STATIC_EXPORT_BUILD) return [];

  return generateLangParams().flatMap(({ lang }) => {
    const appLang = lang as AppLanguage;
    const slugs = new Set<string>();

    for (const key of LIVE_GUIDE_KEYS) {
      slugs.add(guideSlug(appLang, key));
      slugs.add(guideSlug("en", key));
    }

    return Array.from(slugs).map((slug) => ({ lang, slug }));
  });
}

export function redirectLegacyGuideAlias(lang: AppLanguage, slug: string): never {
  const guideKey = resolveLegacyGuideKey(slug, lang);
  if (!guideKey || !isGuideLive(guideKey)) {
    notFound();
  }

  permanentRedirect(guidePath(lang, guideKey));
}
