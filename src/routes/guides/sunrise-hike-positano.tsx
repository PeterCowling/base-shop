// src/routes/guides/sunrise-hike-positano.tsx
import { memo, useMemo } from "react";

import { defineGuideRoute } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

import type { GuideSeoTemplateContext } from "./guide-seo/types";

import GenericContent, { type GenericContentTranslator } from "@/components/guides/GenericContent";
import ImageGallery from "@/components/guides/ImageGallery";
import { buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import i18n from "@/i18n";

export const handle = { tags: ["hiking", "viewpoints", "positano"] };

export const GUIDE_KEY: GuideKey = "sunriseHike";
export const GUIDE_SLUG = "sunrise-hike-positano" as const;

const MemoGenericContent = memo(GenericContent);

const INTRO_KEY = `content.${GUIDE_KEY}.intro`;
const SECTIONS_KEY = `content.${GUIDE_KEY}.sections`;
const FAQS_KEY = `content.${GUIDE_KEY}.faqs`;
const STRUCTURED_KEYS = new Set([INTRO_KEY, SECTIONS_KEY, FAQS_KEY]);

function resolveStructuredArray(
  value: unknown,
  key: string,
  fallbackTranslator: GenericContentTranslator,
): unknown[] {
  if (Array.isArray(value) && value.length > 0) return value;
  const fallback = fallbackTranslator(key, { returnObjects: true });
  return Array.isArray(fallback) && fallback.length > 0 ? fallback : [];
}

function SunriseHikeExtras({ context }: { context: GuideSeoTemplateContext }): JSX.Element {
  const englishGuidesTranslator = useMemo<GenericContentTranslator>(() => {
    try {
      return i18n.getFixedT("en", "guides") as GenericContentTranslator;
    } catch {
      return context.translateGuides;
    }
  }, [context.translateGuides]);

  const intro = context.translateGuides(INTRO_KEY, { returnObjects: true }) as unknown;
  const sections = context.translateGuides(SECTIONS_KEY, { returnObjects: true }) as unknown;
  const resolvedIntro = resolveStructuredArray(intro, INTRO_KEY, englishGuidesTranslator);
  const resolvedSections = resolveStructuredArray(sections, SECTIONS_KEY, englishGuidesTranslator);
  const hasStructured = resolvedIntro.length > 0 || resolvedSections.length > 0;

  const translator = useMemo<GenericContentTranslator>(() => {
    return ((key: string, options?: Record<string, unknown>) => {
      if (key.startsWith(`content.${GUIDE_KEY}.seo.`)) {
        try {
          const enFallback = englishGuidesTranslator(key, options);
          if (enFallback !== undefined) return enFallback;
        } catch {
          /* noop */
        }
      }

      const primary = context.translateGuides(key, options);
      if (
        options?.returnObjects &&
        STRUCTURED_KEYS.has(key) &&
        Array.isArray(primary) &&
        primary.length === 0
      ) {
        const fallback = englishGuidesTranslator(key, options);
        if (Array.isArray(fallback) && fallback.length > 0) {
          return fallback;
        }
      }
      return primary;
    }) as GenericContentTranslator;
  }, [context.translateGuides, englishGuidesTranslator]);

  return (
    <>
      {hasStructured ? <MemoGenericContent guideKey={GUIDE_KEY} t={translator} /> : null}
      <SunriseHikeGallery translator={context.translateGuides} />
    </>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for sunriseHike");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    relatedGuides: {
      items: [
        { key: "topOfTheMountainHike" },
        { key: "sunsetViewpoints" },
        { key: "pathOfTheGods" },
      ],
    },
    articleExtras: (context) => <SunriseHikeExtras context={context} />,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = `/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta, links };

type GalleryTranslator = (key: string, opts?: Record<string, unknown>) => unknown;

export function SunriseHikeGallery({ translator }: { translator: GalleryTranslator }): JSX.Element | null {
  const itemsRaw = translator(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true }) as unknown;
  const items = Array.isArray(itemsRaw) ? (itemsRaw as Array<{ alt?: string; caption?: string }>) : [];

  const sources = [
    "/img/guides/sunrise-hike/01-qr.png",
    "/img/guides/sunrise-hike/02-house.jpg",
    "/img/guides/sunrise-hike/03-viewpoint.jpg",
  ] as const;

  const galleryItems = sources
    .map((src, index) => {
      const t = items[index] ?? {};
      const alt = typeof t.alt === "string" ? t.alt.trim() : "";
      const caption = typeof t.caption === "string" ? t.caption.trim() : "";
      if (!alt || !caption) return null;
      return { src, alt, caption };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (galleryItems.length === 0) return null;

  const galleryTitleRaw = translator(`content.${GUIDE_KEY}.gallery.title`) as unknown;
  const galleryTitle = typeof galleryTitleRaw === "string" && galleryTitleRaw.trim().length > 0
    ? galleryTitleRaw
    : null;

  return (
    <section id="gallery" className="not-prose">
      {galleryTitle ? <h2 className="prose prose-slate dark:prose-invert">{galleryTitle}</h2> : null}
      <ImageGallery items={galleryItems} />
    </section>
  );
}