/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/GuideFaqJsonLd.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { buildFaqJsonLd, type NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { ensureLeadingSlash, normaliseWindowPath, useOptionalRouterPathname } from "./locationUtils";

interface GuideFaqJsonLdProps {
  guideKey: GuideKey;
  fallback?: (lang: string) => NormalizedFaqEntry[] | null | undefined;
}

function GuideFaqJsonLd({ guideKey, fallback }: GuideFaqJsonLdProps): JSX.Element | null {
  const lang = useCurrentLanguage();
  const routerPathname = useOptionalRouterPathname();
  const fallbackPath = normaliseWindowPath();
  const rawPathname = routerPathname ?? fallbackPath;
  const pathname = rawPathname ? ensureLeadingSlash(rawPathname) : undefined;
  const { t } = useTranslation("guides", { lng: lang });
  const faqsRaw = t(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
  const faqsResolved = useMemo(() => {
    if (Array.isArray(faqsRaw)) return faqsRaw;
    const fromStore = getGuideResource<unknown>(lang, `content.${guideKey}.faqs`);
    if (fromStore !== undefined && fromStore !== null) return fromStore;
    if (lang !== "en") {
      const fromEn = getGuideResource<unknown>("en", `content.${guideKey}.faqs`);
      if (fromEn !== undefined && fromEn !== null) return fromEn;
    }
    return faqsRaw;
  }, [faqsRaw, guideKey, lang]);

  const canonicalUrl = useMemo(() => {
    if (typeof pathname === "string" && pathname.length > 0) {
      return `${BASE_URL}${pathname}`;
    }
    return guideAbsoluteUrl(lang, guideKey);
  }, [guideKey, lang, pathname]);

  const faqJson = useMemo(() => {
    const fromTranslations = buildFaqJsonLd(lang, canonicalUrl, faqsResolved);
    if (fromTranslations && fromTranslations.length > 0) {
      return fromTranslations;
    }

    if (!fallback) {
      return "";
    }

    // Try route-provided fallback for the active language; if that yields
    // no entries, attempt EN explicitly as a last resort to satisfy tests
    // that strip locale data entirely.
    const primaryFallback = fallback(lang);
    const primaryJson = buildFaqJsonLd(lang, canonicalUrl, primaryFallback);
    if (primaryJson && primaryJson.length > 0) return primaryJson;

    try {
      const enFallback = fallback("en");
      return buildFaqJsonLd(lang, canonicalUrl, enFallback);
    } catch {
      return "";
    }
  }, [canonicalUrl, faqsResolved, fallback, lang]);

  if (!faqJson) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: faqJson }}
    />
  );
}

export default memo(GuideFaqJsonLd);
