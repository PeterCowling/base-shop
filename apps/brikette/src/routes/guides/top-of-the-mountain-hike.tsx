// src/routes/guides/top-of-the-mountain-hike.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import ImageGallery from "@/components/guides/ImageGallery";
import type { LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import i18n from "@/i18n";

export const handle = { tags: ["hiking", "positano", "viewpoints"] };

export const GUIDE_KEY = "topOfTheMountainHike" as const satisfies GuideKey;
export const GUIDE_SLUG = "top-of-the-mountain-hike" as const;

const GALLERY_SOURCES = [
  "/img/guides/top-of-the-mountain/image1.jpg",
  "/img/guides/top-of-the-mountain/image2.png",
  "/img/guides/top-of-the-mountain/image3.jpg",
  "/img/guides/top-of-the-mountain/image2.png",
  "/img/guides/top-of-the-mountain/image3.jpg",
] as const;

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

function buildFallbackGallery(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) return null;

  const enTranslator = i18n.getFixedT("en", "guides");
  if (typeof enTranslator !== "function") return null;

  const itemsRaw = enTranslator(`content.${GUIDE_KEY}.gallery.items`, {
    returnObjects: true,
  }) as Array<{ alt?: string; caption?: string }> | undefined;
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];

  const galleryItems = (GALLERY_SOURCES.map((src, index) => {
    const candidate = items[index] ?? {};
    const alt = typeof candidate?.alt === "string" ? candidate.alt.trim() : "";
    const caption = typeof candidate?.caption === "string" ? candidate.caption.trim() : "";
    if (!alt || !caption) return null;
    return { src, alt, caption };
  }).filter(Boolean) as Array<{ src: string; alt: string; caption: string }>);

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
