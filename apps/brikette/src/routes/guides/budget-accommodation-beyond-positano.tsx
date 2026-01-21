// src/routes/guides/budget-accommodation-beyond-positano.tsx
import type { LinksFunction } from "react-router";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import EN_GUIDES_LABELS from "@/locales/en/guides/labels.json";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["accommodation", "budgeting", "amalfi"] };

export const GUIDE_KEY: GuideKey = "budgetAccommodationBeyond";
export const GUIDE_SLUG = "budget-accommodation-beyond-positano" as const;

const OG_IMAGE_CONFIG = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  transform: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for budgetAccommodationBeyond"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const EN_GUIDE_LABEL_FALLBACKS = EN_GUIDES_LABELS as {
  homeBreadcrumb?: string;
  guidesBreadcrumb?: string;
  indexTitle?: string;
};

const FALLBACK_HOME_LABEL = (EN_GUIDE_LABEL_FALLBACKS.homeBreadcrumb ?? "").trim();
const FALLBACK_GUIDES_LABEL = (EN_GUIDE_LABEL_FALLBACKS.guidesBreadcrumb ?? "").trim();
const FALLBACK_INDEX_TITLE = (EN_GUIDE_LABEL_FALLBACKS.indexTitle ?? "").trim();

function createBreadcrumb(entry: GuideManifestEntry) {
  return (context: GuideSeoTemplateContext): BreadcrumbList => {
    const { lang, translateGuides, article } = context;
    const baseSlug = (() => {
      try {
        return getSlug("guides", lang);
      } catch {
        return "guides";
      }
    })();
    const pageSlug = (() => {
      try {
        return guideSlug(lang, entry.key);
      } catch {
        return guideSlug("en", entry.key);
      }
    })();

    const normaliseLabel = (value: unknown, fallback: string) => {
      if (typeof value !== "string") return fallback;
      const trimmed = value.trim();
      if (!trimmed || trimmed === fallback) return fallback;
      if (trimmed.startsWith("［Stub］")) return fallback;
      return trimmed;
    };

    const homeLabel = normaliseLabel(
      translateGuides?.("labels.homeBreadcrumb", { defaultValue: FALLBACK_HOME_LABEL }),
      FALLBACK_HOME_LABEL,
    );

    const rawGuidesLabel = normaliseLabel(
      translateGuides?.("labels.guidesBreadcrumb", { defaultValue: FALLBACK_GUIDES_LABEL }),
      FALLBACK_GUIDES_LABEL,
    );
    const guidesLabel = (() => {
      const trimmed = rawGuidesLabel.trim();
      const fallbackGuides = FALLBACK_GUIDES_LABEL || trimmed;
      if (!trimmed) return fallbackGuides;
      const sentinel = new Set([
        "labels.guidesBreadcrumb",
        "breadcrumbs.guides",
        "labels.indexTitle",
        "meta.index.title",
        "guides:labels.indexTitle",
      ]);
      if (FALLBACK_GUIDES_LABEL) {
        sentinel.add(FALLBACK_GUIDES_LABEL);
      }
      if (sentinel.has(trimmed)) return fallbackGuides;
      const fallbackIndexLower = FALLBACK_INDEX_TITLE.toLowerCase();
      if (fallbackIndexLower && trimmed.toLowerCase().includes(fallbackIndexLower)) {
        return fallbackGuides;
      }
      const fallbackGuidesLower = FALLBACK_GUIDES_LABEL.toLowerCase();
      if (fallbackGuidesLower && trimmed.toLowerCase() === fallbackGuidesLower) {
        return fallbackGuides;
      }
      return trimmed;
    })();

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${lang}` },
        {
          "@type": "ListItem",
          position: 2,
          name: guidesLabel,
          item: `${BASE_URL}/${lang}/${baseSlug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: `${BASE_URL}/${lang}/${baseSlug}/${pageSlug}`,
        },
      ],
    } satisfies BreadcrumbList;
  };
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE_CONFIG,
    buildBreadcrumb: createBreadcrumb(manifestEntry),
    renderGenericWhenEmpty: true,
    preferGenericWhenFallback: true,
  }),
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_CONFIG.path, OG_IMAGE_CONFIG.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE_CONFIG.width, height: OG_IMAGE_CONFIG.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
