import { useMemo } from "react";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { slugify } from "@/utils/slugify";

interface DefaultBreadcrumbArgs {
  lang: AppLanguage;
  guideKey: GuideKey;
  title: string;
  homeLabel: string;
  guidesLabel: string;
}

export function useDefaultBreadcrumb({
  lang,
  guideKey,
  title,
  homeLabel,
  guidesLabel,
}: DefaultBreadcrumbArgs): BreadcrumbList {
  return useMemo(() => {
    // Localize the base segment so breadcrumbs reflect the active language
    const baseSlug = (() => {
      try {
        return getSlug("guides", lang as AppLanguage);
      } catch {
        return "guides";
      }
    })();
    // Prefer locale-specific slugs for guide pages so breadcrumbs reflect
    // the active language's slug generation rules used by guideSlug().
    const pageSlug = (() => {
      try {
        return guideSlug(lang as AppLanguage, guideKey);
      } catch {
        return slugify(String(guideKey));
      }
    })();
    const safe = (s: unknown) => (typeof s === "string" ? s.trim() : "");
    const coerceLabel = (
      value: string,
      fallback: string,
      options: { sentinelKeys: string[]; translationKey: string },
    ): string => {
      const sentinelSet = new Set(
        options.sentinelKeys
          .map((key) => safe(key))
          .filter((key): key is string => key.length > 0)
          .map((key) => key.toLowerCase()),
      );
      const normalized = safe(value);
      const normalizedLower = normalized.toLowerCase();
      const hasPlaceholderValue = normalized.length > 0 && sentinelSet.has(normalizedLower);
      if (normalized.length > 0 && !hasPlaceholderValue) {
        return normalized;
      }

      const fallbackNormalized = safe(fallback);
      const fallbackLower = fallbackNormalized.toLowerCase();
      const fallbackIsPlaceholder = fallbackNormalized.length > 0 && sentinelSet.has(fallbackLower);
      if (fallbackNormalized.length > 0 && !fallbackIsPlaceholder) {
        return fallbackNormalized;
      }

      const translationKeyNormalized = safe(options.translationKey);
      if (translationKeyNormalized.length > 0) {
        return translationKeyNormalized;
      }

      return normalized || fallbackNormalized || options.translationKey;
    };
    const homeFallback = "Home";
    const homeSafe = coerceLabel(homeLabel, homeFallback, {
      translationKey: "labels.homeBreadcrumb",
      sentinelKeys: ["labels.homeBreadcrumb", "breadcrumbs.home", "header:home"],
    });
    const guidesFallback = "Guides";
    const guidesSafe = coerceLabel(guidesLabel, guidesFallback, {
      translationKey: "labels.guidesBreadcrumb",
      sentinelKeys: [
        "labels.guidesBreadcrumb",
        "breadcrumbs.guides",
        "labels.indexTitle",
        "meta.index.title",
        "guides:labels.indexTitle",
      ],
    });
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeSafe, item: `${BASE_URL}/${lang}` },
        {
          "@type": "ListItem",
          position: 2,
          name: guidesSafe,
          item: `${BASE_URL}/${lang}/${baseSlug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: `${BASE_URL}/${lang}/${baseSlug}/${pageSlug}`,
        },
      ],
    } satisfies BreadcrumbList;
  }, [guideKey, guidesLabel, homeLabel, lang, title]);
}
