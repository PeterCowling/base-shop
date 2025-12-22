import { useMemo } from "react";

import { BASE_URL } from "@/config/site";
// Import from the consolidated slugs helper to avoid tests that partially
// mock "@/routes.guides-helpers" and omit certain exports.
import * as Slugs from "@/guides/slugs";
import { getSlug } from "@/utils/slug";
import { slugify } from "@/utils/slugify";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

interface CanonicalUrlArgs {
  pathname?: string | null;
  lang: AppLanguage;
  guideKey: GuideKey;
}

export function useCanonicalUrl({ pathname, lang, guideKey }: CanonicalUrlArgs): string {
  return useMemo(() => {
    if (typeof pathname === "string" && pathname.length > 0) {
      return `${BASE_URL}${pathname}`;
    }
    // Derive base slug via friendly helper
    const baseSlug = getSlug("guides", lang);
    type GuideSlugFn = (l: AppLanguage, k: GuideKey) => string;
    const guideSlugFn: GuideSlugFn | undefined = (Slugs as { guideSlug?: GuideSlugFn }).guideSlug;
    // Canonicalize to the English guide slug for stability across locales;
    // the language segment remains the active locale.
    const slug = typeof guideSlugFn === "function" ? guideSlugFn("en" as AppLanguage, guideKey) : slugify(String(guideKey));
    return `${BASE_URL}/${lang}/${baseSlug}/${slug}`;
  }, [guideKey, lang, pathname]);
}
