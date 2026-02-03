 
// src/components/seo/GuideFaqJsonLd.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { buildFaqJsonLd, type NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import FaqJsonLdScript from "./FaqJsonLdScript";

interface GuideFaqJsonLdProps {
  guideKey: GuideKey;
  fallback?: (lang: string) => NormalizedFaqEntry[] | null | undefined;
}

function GuideFaqJsonLd({ guideKey, fallback }: GuideFaqJsonLdProps): JSX.Element | null {
  const lang = useCurrentLanguage();
  const { t } = useTranslation("guides", { lng: lang });
  const faqsRaw = t(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
  const faqsResolved = (() => {
    if (Array.isArray(faqsRaw)) return faqsRaw;
    const fromStore = getGuideResource<unknown>(lang, `content.${guideKey}.faqs`);
    if (fromStore !== undefined && fromStore !== null) return fromStore;
    if (lang !== "en") {
      const fromEn = getGuideResource<unknown>("en", `content.${guideKey}.faqs`);
      if (fromEn !== undefined && fromEn !== null) return fromEn;
    }
    return faqsRaw;
  })();

  // Use guide-specific URL directly to ensure consistent server/client rendering.
  // Avoids hydration mismatch from window.location fallback in normaliseWindowPath.
  const canonicalUrl = guideAbsoluteUrl(lang, guideKey);

  const payload = buildFaqJsonLd(lang, canonicalUrl, faqsResolved);

  if (!fallback) {
    return <FaqJsonLdScript data={payload} />;
  }

  const fallbackPayload = (() => {
    if (payload) return null;
    try {
      const primaryFallback = fallback(lang);
      const primaryPayload = buildFaqJsonLd(lang, canonicalUrl, primaryFallback);
      if (primaryPayload) return primaryPayload;
      const enFallback = fallback("en");
      return buildFaqJsonLd(lang, canonicalUrl, enFallback);
    } catch {
      return null;
    }
  })();

  return <FaqJsonLdScript data={payload} fallback={fallbackPayload} />;
}

export default memo(GuideFaqJsonLd);
