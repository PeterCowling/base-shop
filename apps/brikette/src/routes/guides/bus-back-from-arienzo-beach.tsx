// src/routes/guides/bus-back-from-arienzo-beach.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
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
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["beaches", "bus", "positano"] };

export const GUIDE_KEY = "arienzoBeachBusBack" as const satisfies GuideKey;
export const GUIDE_SLUG = "bus-back-from-arienzo-beach" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

const GALLERY_IMAGE = "/img/directions/positano-bus-stop.png" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for arienzoBeachBusBack"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleExtras: buildArienzoGallery,
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();

function buildArienzoGallery(context: GuideSeoTemplateContext) {
  const galleryTitle = translateWithFallback(context, `content.${GUIDE_KEY}.gallery.title`);
  const entries = normaliseGalleryItems(context, `content.${GUIDE_KEY}.gallery.items`);

  const entry = entries.find((item) => item.alt && item.caption);
  if (!entry) return null;

  return (
    <section id="gallery" className="space-y-4">
      {galleryTitle ? <h2>{galleryTitle}</h2> : null}
      <ImageGallery
        items={[
          {
            src: GALLERY_IMAGE,
            alt: entry.alt,
            caption: entry.caption,
          },
        ]}
      />
    </section>
  );
}

function normaliseGalleryItems(context: GuideSeoTemplateContext, key: string) {
  const local = context.translateGuides(key, { returnObjects: true }) as unknown;
  const english = getEnglishTranslator(context)?.(key, { returnObjects: true }) as unknown;

  const normalise = (value: unknown) => {
    if (!Array.isArray(value)) return [] as Array<{ alt?: string; caption?: string }>;
    return value.map((entry) => (entry && typeof entry === "object" ? (entry as { alt?: string; caption?: string }) : {}));
  };

  const localItems = normalise(local);
  const fallbackItems = normalise(english);
  const source = localItems.length > 0 ? localItems : fallbackItems;

  return source.map((item, index) => {
    const fallback = fallbackItems[index] ?? {};
    return {
      alt: pickMeaningfulString(item.alt) ?? pickMeaningfulString(fallback.alt) ?? "",
      caption: pickMeaningfulString(item.caption) ?? pickMeaningfulString(fallback.caption) ?? "",
    };
  });
}

function translateWithFallback(context: GuideSeoTemplateContext, key: string): string {
  const local = normaliseTranslatedString(key, context.translateGuides(key));
  if (local) return local;

  const english = normaliseTranslatedString(key, getEnglishTranslator(context)?.(key));
  if (english) return english;

  return "";
}

function pickMeaningfulString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normaliseTranslatedString(key: string, value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  if (trimmed === key) return "";
  if (trimmed.startsWith(`${key}:`)) return "";
  return trimmed;
}

function getEnglishTranslator(context: GuideSeoTemplateContext) {
  if (typeof context.translateGuidesEn === "function") {
    return context.translateGuidesEn;
  }
  try {
    const fixed = i18n.getFixedT("en", "guides");
    if (typeof fixed === "function") {
      return (key: string, options?: Record<string, unknown>) => fixed(key, options);
    }
  } catch {
    /* noop */
  }
  try {
    const fallback = (i18n as unknown as { __tGuidesFallback?: (key: string, options?: Record<string, unknown>) => unknown })
      .__tGuidesFallback;
    if (typeof fallback === "function") {
      return fallback;
    }
  } catch {
    /* noop */
  }
  return undefined;
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
