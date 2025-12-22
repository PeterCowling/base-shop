/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/GuideFaqJsonLd.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
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

  const canonicalUrl = useMemo(() => {
    if (typeof pathname === "string" && pathname.length > 0) {
      return `${BASE_URL}${pathname}`;
    }
    return guideAbsoluteUrl(lang, guideKey);
  }, [guideKey, lang, pathname]);

  const faqJson = useMemo(() => {
    const fromTranslations = buildFaqJsonLd(lang, canonicalUrl, faqsRaw);
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
  }, [canonicalUrl, faqsRaw, fallback, lang]);

  if (!faqJson) {
    return null;
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJson }} />;
}

export default memo(GuideFaqJsonLd);
