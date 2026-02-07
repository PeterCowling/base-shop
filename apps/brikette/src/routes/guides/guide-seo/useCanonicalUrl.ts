import { useMemo } from "react";

import { BASE_URL } from "@/config/site";
// Import from the consolidated slugs helper to avoid tests that partially
// mock "@/routes.guides-helpers" and omit certain exports.
import * as Slugs from "@/guides/slugs";
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
    type GuideAbsFn = (l: AppLanguage, k: GuideKey) => string;
    const guideAbsFn: GuideAbsFn | undefined = (Slugs as { guideAbsoluteUrl?: GuideAbsFn }).guideAbsoluteUrl;
    if (typeof guideAbsFn === "function") {
      return guideAbsFn(lang, guideKey);
    }
    type GuideHrefFn = (l: AppLanguage, k: GuideKey) => string;
    const guideHrefFn: GuideHrefFn | undefined = (Slugs as { guideHref?: GuideHrefFn }).guideHref;
    const href = typeof guideHrefFn === "function" ? guideHrefFn(lang, guideKey) : `/${lang}/${guideKey}`;
    return `${BASE_URL}${href}`;
  }, [guideKey, lang, pathname]);
}
