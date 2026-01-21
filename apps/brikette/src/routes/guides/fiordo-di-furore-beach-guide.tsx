// src/routes/guides/fiordo-di-furore-beach-guide.tsx
import type { LinksFunction } from "react-router";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import { CfImage } from "@/components/images/CfImage";
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

type LabelTranslator = GenericContentTranslator | undefined;

const HOME_FALLBACK_LABEL = "Home";
const GUIDES_FALLBACK_LABEL = "Guides";

function stripNamespace(value: string): string {
  return value.replace(/^[a-z0-9_-]+:/i, "");
}

function normaliseCandidate(value: unknown, key: string, fallbackKey: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalised = stripNamespace(trimmed).trim();
  if (!normalised) return undefined;
  const placeholders = new Set([
    key,
    fallbackKey,
    `guides.${key}`,
    `guides.${fallbackKey}`,
    `content.${key}`,
    `content.${fallbackKey}`,
  ]);
  if (placeholders.has(normalised)) return undefined;
  return trimmed;
}

function extractLabel(translator: LabelTranslator, key: string, fallbackKey: string): string | undefined {
  if (typeof translator !== "function") return undefined;
  const candidates: unknown[] = [];
  try {
    candidates.push(translator(key));
  } catch {
    /* noop */
  }
  try {
    candidates.push(translator(fallbackKey));
  } catch {
    /* noop */
  }
  for (const candidate of candidates) {
    const resolved = normaliseCandidate(candidate, key, fallbackKey);
    if (resolved) return resolved;
  }
  return undefined;
}

function resolveBreadcrumbLabel({
  translator,
  fallbackTranslator,
  key,
  fallbackKey,
  defaultLabel,
  preferFallback,
}: {
  translator: LabelTranslator;
  fallbackTranslator: LabelTranslator;
  key: string;
  fallbackKey: string;
  defaultLabel: string;
  preferFallback: boolean;
}): string {
  const localized = extractLabel(translator, key, fallbackKey);
  const fallback = extractLabel(fallbackTranslator, key, fallbackKey);
  const primary = preferFallback ? fallback : localized;
  const secondary = preferFallback ? localized : fallback;
  return primary ?? secondary ?? defaultLabel;
}

export const handle = { tags: ["beaches", "furore", "cliff-jumping"] };

export const GUIDE_KEY = "fiordoDiFuroreBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "fiordo-di-furore-beach-guide" as const;

const RELATED_GUIDES = [
  { key: "positanoBeaches" },
  { key: "marinaDiPraiaBeaches" },
  { key: "gavitellaBeachGuide" },
] as const;

function buildBreadcrumb(context: GuideSeoTemplateContext): BreadcrumbList {
  const lang = context.lang as AppLanguage;
  const translator = context.translateGuides ?? context.translator;
  const translatorFn = typeof translator === "function" ? translator : undefined;
  const fallbackTranslator = (() => {
    try {
      const fixed = i18n.getFixedT?.("en", "guides");
      return typeof fixed === "function" ? (fixed as LabelTranslator) : undefined;
    } catch {
      return undefined;
    }
  })();

  const preferFallback = !context.hasLocalizedContent;
  const resolvedHome = resolveBreadcrumbLabel({
    translator: translatorFn,
    fallbackTranslator,
    key: "breadcrumbs.home",
    fallbackKey: "labels.homeBreadcrumb",
    defaultLabel: HOME_FALLBACK_LABEL,
    preferFallback,
  });
  const resolvedGuides = resolveBreadcrumbLabel({
    translator: translatorFn,
    fallbackTranslator,
    key: "breadcrumbs.guides",
    fallbackKey: "labels.guidesBreadcrumb",
    defaultLabel: GUIDES_FALLBACK_LABEL,
    preferFallback,
  });

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
  throw new Error("guide manifest entry missing for fiordoDiFuroreBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
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

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE_CONFIG,
    preferGenericWhenFallback: true,
    buildBreadcrumb,
    relatedGuides: { items: RELATED_GUIDES.map((item) => ({ key: item.key })) },
    genericContentOptions: {
      sectionTopExtras: {
        "on-site": <FiordoSectionFigure />,
      },
    },
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
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const descriptors = baseLinks(...linkArgs);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};

const ARTICLE_IMAGE = {
  src: "/img/guides/fiordo-di-furore/fiordo-di-furore-cove.png",
  width: 700,
  height: 425,
} as const;

const ARTICLE_IMAGE_COPY_KEYS = {
  alt: `content.${GUIDE_KEY}.sectionFigure.alt`,
  caption: `content.${GUIDE_KEY}.sectionFigure.caption`,
} as const;

function useGuideCopyResolver(): (key: string) => string {
  const lang = useCurrentLanguage();
  const { translateGuides, guidesEn } = useGuideTranslations(lang);
  const normalize = (value: unknown, key: string): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed === key) return undefined;
    return trimmed;
  };
  return (key: string) =>
    normalize(translateGuides(key), key) ?? normalize(guidesEn(key), key) ?? "";
}

function FiordoSectionFigure(): JSX.Element {
  const copy = useGuideCopyResolver();
  return (
    <figure className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60">
      <CfImage
        src={ARTICLE_IMAGE.src}
        width={ARTICLE_IMAGE.width}
        height={ARTICLE_IMAGE.height}
        preset="gallery"
        alt={copy(ARTICLE_IMAGE_COPY_KEYS.alt)}
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="mt-2 text-center text-sm text-brand-text/80">
        {copy(ARTICLE_IMAGE_COPY_KEYS.caption)}
      </figcaption>
    </figure>
  );
}
