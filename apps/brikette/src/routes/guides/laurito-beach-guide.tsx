// src/routes/guides/laurito-beach-guide.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { CfImage } from "@/components/images/CfImage";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import {
  getGuideManifestEntry,
  type GuideAreaSlugKey,
  guideAreaToSlugKey,
} from "./guide-manifest";

export const handle = { tags: ["beaches", "positano", "tips"] };

export const GUIDE_KEY = "lauritoBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "laurito-beach-guide" as const;

const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

const SECTION_IMAGE_VARIANTS = {
  "why-go": "whyGo",
  layout: "layout",
  "tre-ville": "treVille",
  "da-adolfo": "daAdolfo",
} as const;

type SectionImageVariant = (typeof SECTION_IMAGE_VARIANTS)[keyof typeof SECTION_IMAGE_VARIANTS];

const LAURITO_SECTION_IMAGES: Record<
  SectionImageVariant,
  { src: string; width: number; height: number }
> = {
  whyGo: {
    src: "/img/guides/laurito/laurito-2.jpg",
    width: 1500,
    height: 1000,
  },
  layout: {
    src: "/img/guides/laurito/laurito-5.jpg",
    width: 512,
    height: 215,
  },
  treVille: {
    src: "/img/guides/laurito/laurito-4.jpg",
    width: 1280,
    height: 1600,
  },
  daAdolfo: {
    src: "/img/guides/laurito/laurito-3.jpg",
    width: 403,
    height: 500,
  },
};

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for lauritoBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    genericContentOptions: {
      sectionTopExtras: {
        "why-go": <LauritoSectionFigure variant={SECTION_IMAGE_VARIANTS["why-go"]} />,
        layout: <LauritoSectionFigure variant={SECTION_IMAGE_VARIANTS.layout} />,
        "tre-ville": <LauritoSectionFigure variant={SECTION_IMAGE_VARIANTS["tre-ville"]} />,
        "da-adolfo": <LauritoSectionFigure variant={SECTION_IMAGE_VARIANTS["da-adolfo"]} />,
      },
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (
  ...args: Parameters<LinksFunction>
) => {
  const descriptors = baseLinks(...args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};

type SectionFigureProps = {
  variant: SectionImageVariant;
};

function LauritoSectionFigure({ variant }: SectionFigureProps): JSX.Element {
  const currentLang = useCurrentLanguage();
  const lang = (currentLang ?? i18nConfig.fallbackLng) as AppLanguage;
  const image = LAURITO_SECTION_IMAGES[variant];
  const alt = translateWithFallback(
    i18n.getFixedT(lang, "guides"),
    `content.${GUIDE_KEY}.images.${variant}.alt`,
  );
  const caption = translateWithFallback(
    i18n.getFixedT(lang, "guides"),
    `content.${GUIDE_KEY}.images.${variant}.caption`,
  );

  return (
    <figure className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60">
      <CfImage
        src={image.src}
        width={image.width}
        height={image.height}
        preset="gallery"
        alt={alt}
        className="h-auto w-full rounded-lg"
      />
      {caption ? <figcaption className="mt-2 text-center text-sm text-brand-text/80">{caption}</figcaption> : null}
    </figure>
  );
}

function translateWithFallback(
  translate: ((key: string, options?: Record<string, unknown>) => unknown) | undefined,
  key: string,
): string {
  if (typeof translate !== "function") return "";
  const primary = translate(key);
  if (typeof primary === "string") {
    const trimmed = primary.trim();
    if (trimmed.length > 0 && trimmed !== key) return trimmed;
  }
  try {
    const fallback = i18n.getFixedT("en", "guides")?.(key);
    if (typeof fallback === "string") {
      const trimmed = fallback.trim();
      if (trimmed.length > 0 && trimmed !== key) return trimmed;
    }
  } catch {
    // ignore fallback errors
  }
  return "";
}

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const areaSlug = getSlug(areaSlugKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished,
    });
  };
}
