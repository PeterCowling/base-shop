// src/routes/guides/top-of-the-mountain-hike.tsx
import type { LinksFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import { CfImage } from "@/components/images/CfImage";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";

export const handle = { tags: ["hiking", "positano", "viewpoints"] };

export const GUIDE_KEY = "topOfTheMountainHike" as const satisfies GuideKey;
export const GUIDE_SLUG = "top-of-the-mountain-hike" as const;

const GALLERY_SOURCES = [
  {
    src: "/img/guides/top-of-the-mountain/summit-view.jpg",
    width: 800,
    height: 397,
  },
  {
    src: "/img/guides/top-of-the-mountain/elevation-profile.jpg",
    width: 409,
    height: 333,
  },
] as const;

const SECTION_IMAGES = {
  summitView: {
    src: "/img/guides/top-of-the-mountain/summit-view.jpg",
    width: 800,
    height: 397,
    altKey: `content.${GUIDE_KEY}.gallery.items.0.alt`,
    captionKey: `content.${GUIDE_KEY}.gallery.items.0.caption`,
  },
  elevationProfile: {
    src: "/img/guides/top-of-the-mountain/elevation-profile.jpg",
    width: 409,
    height: 333,
    altKey: `content.${GUIDE_KEY}.gallery.items.1.alt`,
    captionKey: `content.${GUIDE_KEY}.gallery.items.1.caption`,
  },
} as const;

const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_DIMS.width,
  height: OG_DIMS.height,
  transform: {
    width: OG_DIMS.width,
    height: OG_DIMS.height,
    quality: 85,
    format: "auto",
  },
} as const;

type GuideSectionFigureProps = {
  src: string;
  width: number;
  height: number;
  altKey: string;
  captionKey: string;
};

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

function GuideSectionFigure({
  src,
  width,
  height,
  altKey,
  captionKey,
}: GuideSectionFigureProps): JSX.Element | null {
  const lang = useCurrentLanguage();
  const copy = useGuideCopyResolver();
  if (lang !== "en") return null;

  return (
    <figure className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60">
      <CfImage
        src={src}
        width={width}
        height={height}
        preset="gallery"
        alt={copy(altKey)}
        className="h-auto w-full rounded-lg"
      />
      <figcaption className="mt-2 text-center text-sm text-brand-text/80">
        {copy(captionKey)}
      </figcaption>
    </figure>
  );
}

function buildFallbackGallery(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;

  const enTranslator = i18n.getFixedT("en", "guides");
  if (typeof enTranslator !== "function") return null;

  const itemsRaw = enTranslator(`content.${GUIDE_KEY}.gallery.items`, {
    returnObjects: true,
  }) as Array<{ alt?: string; caption?: string }> | undefined;
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];

  const galleryItems = (GALLERY_SOURCES.map((item, index) => {
    const candidate = items[index] ?? {};
    const alt = typeof candidate?.alt === "string" ? candidate.alt.trim() : "";
    const caption = typeof candidate?.caption === "string" ? candidate.caption.trim() : "";
    if (!alt || !caption) return null;
    return { src: item.src, alt, caption, width: item.width, height: item.height };
  }).filter(Boolean) as Array<{ src: string; alt: string; caption: string; width: number; height: number }>);

  if (galleryItems.length === 0) return null;

  const titleRaw = enTranslator(`content.${GUIDE_KEY}.gallery.title`) as unknown;
  const title = typeof titleRaw === "string" && titleRaw.trim().length > 0 ? titleRaw.trim() : undefined;

  return (
    <section id="gallery">
      {title ? <h2>{title}</h2> : null}
      <ImageGallery items={galleryItems} />
    </section>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for topOfTheMountainHike"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleExtras: buildFallbackGallery,
    ogImage: OG_IMAGE,
    genericContentOptions: {
      sectionTopExtras: {
        "why-go": <GuideSectionFigure {...SECTION_IMAGES.summitView} />,
        "getting-to-santa-maria": <GuideSectionFigure {...SECTION_IMAGES.elevationProfile} />,
      },
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
