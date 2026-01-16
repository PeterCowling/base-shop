// src/routes/guides/fiordo-di-furore-beach-guide.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

export const handle = { tags: ["beaches", "furore", "cliff-jumping"] };

export const GUIDE_KEY = "fiordoDiFuroreBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "fiordo-di-furore-beach-guide" as const;

const RELATED_GUIDES = [
  { key: "positanoBeaches" },
  { key: "marinaDiPraiaBeaches" },
  { key: "gavitellaBeachGuide" },
] as const;

function normalizeLabel(value: unknown, fallbackKey: string): string {
  if (typeof value !== "string") return fallbackKey;
  const trimmed = value.trim();
  if (!trimmed || trimmed === fallbackKey) return fallbackKey;
  return trimmed;
}

function buildBreadcrumb(context: GuideSeoTemplateContext): BreadcrumbList {
  const lang = context.lang as AppLanguage;
  const translator = context.translateGuides ?? context.translator;

  const homeLabel = normalizeLabel(translator?.("breadcrumbs.home"), "labels.homeBreadcrumb");
  const guidesLabel = normalizeLabel(translator?.("breadcrumbs.guides"), "labels.guidesBreadcrumb");

  let resolvedHome = homeLabel;
  let resolvedGuides = guidesLabel;

  if (!context.hasLocalizedContent) {
    try {
      const fallback = i18n.getFixedT?.("en", "guides");
      if (typeof fallback === "function") {
        resolvedHome = normalizeLabel(fallback("breadcrumbs.home"), resolvedHome);
        resolvedGuides = normalizeLabel(fallback("breadcrumbs.guides"), resolvedGuides);
      }
    } catch {
      // ignore fallback errors
    }
  }

  const baseSlug = (() => {
    try {
      return getSlug("guides", lang);
    } catch {
      return "guides";
    }
  })();

  const pageSlug = (() => {
    try {
      return guideSlug(lang, context.guideKey);
    } catch {
      return String(context.guideKey);
    }
  })();

  const articleTitle =
    typeof context.article?.title === "string" && context.article.title.trim()
      ? context.article.title
      : context.metaKey;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: resolvedHome, item: `${BASE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: resolvedGuides, item: `${BASE_URL}/${lang}/${baseSlug}` },
      {
        "@type": "ListItem",
        position: 3,
        name: articleTitle,
        item: `${BASE_URL}/${lang}/${baseSlug}/${pageSlug}`,
      },
    ],
  } satisfies BreadcrumbList;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for fiordoDiFuroreBeachGuide");
}

const OG_IMAGE_CONFIG = {
  path: "/img/positano-panorama.avif",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  transform: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  },
} as const;

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE_CONFIG,
    preferGenericWhenFallback: true,
    buildBreadcrumb,
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_CONFIG.path, OG_IMAGE_CONFIG.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE_CONFIG.width, height: OG_IMAGE_CONFIG.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args: GuideLinksArgs | undefined) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const areaSlug = getSlug(baseKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };