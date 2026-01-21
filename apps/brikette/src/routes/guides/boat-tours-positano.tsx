// src/routes/guides/boat-tours-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { normalizeFaqEntries } from "@/utils/buildFaqJsonLd";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, type GuideManifestEntry } from "./guide-manifest";
import { resolveGuideOgType } from "./guide-seo/utils/resolveOgType";

export const handle = { tags: ["experiences", "boat", "positano"] };
export const GUIDE_KEY: GuideKey = "boatTours";
export const GUIDE_SLUG = "boat-tours-positano" as const;

const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

function buildGuideMeta(entry: GuideManifestEntry): MetaFunction {
  const metaKey = entry.metaKey ?? entry.key;
  const isPublished = entry.status === "live";
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? ("en" as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY, { forceGuidesBase: true });
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    const resolvedOgType = resolveGuideOgType(entry, entry.options?.ogType);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: resolvedOgType,
      includeTwitterUrl: true,
      isPublished,
    });
  };
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for boatTours"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    preferGenericWhenFallback: true,
    relatedGuides: {
      items: [
        { key: "ferrySchedules" },
        { key: "capriDayTrip" },
        { key: "sunsetViewpoints" },
      ],
    },
    guideFaqFallback: () => {
      const enT = i18n.getFixedT("en", "guides");
      const raw = enT(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown;
      const normalized = normalizeFaqEntries(raw);
      return normalized.length > 0 ? normalized : null;
    },
    articleExtras: ({ translateGuides }) => {
      const trim = (value: unknown) => (typeof value === "string" ? value.trim() : "");

      const getEnglishGuides = () => {
        try {
          const enFixed = i18n.getFixedT?.("en", "guides");
          if (typeof enFixed === "function") return enFixed;
        } catch {
          /* noop */
        }
        return undefined;
      };

      const enGuides = getEnglishGuides();

      const resolveString = (suffix: string) => {
        const key = `content.${GUIDE_KEY}.${suffix}`;
        const localized = trim(translateGuides(key) as string);
        if (localized.length > 0) return localized;

        if (enGuides) {
          const fallback = trim(enGuides(key) as string);
          if (fallback.length > 0) return fallback;
        }

        try {
          const resource = i18n.getResource?.("en", "guides", key);
          if (typeof resource === "string") {
            const fallback = resource.trim();
            if (fallback.length > 0) return fallback;
          }
        } catch {
          /* noop */
        }

        return "";
      };

      const heading = resolveString("galleryHeading");
      const primaryAlt = resolveString("gallery.primaryAlt");
      const primaryCaption = resolveString("gallery.primaryCaption");
      const secondaryAlt = resolveString("gallery.secondaryAlt");
      const secondaryCaption = resolveString("gallery.secondaryCaption");
      const items = [
        {
          src: buildCfImageUrl("/img/positano-boat-coast.avif", {
            width: 1200,
            height: 800,
            quality: 85,
            format: "auto",
          }),
          alt: primaryAlt,
          caption: primaryCaption,
        },
        {
          src: buildCfImageUrl("/img/positano-boat-swimstop.avif", {
            width: 1200,
            height: 800,
            quality: 85,
            format: "auto",
          }),
          alt: secondaryAlt,
          caption: secondaryCaption,
        },
      ];
      return (
        <section id="gallery">
          <h2>{heading}</h2>
          <ImageGallery items={items} />
        </section>
      );
    },
  }),
  meta: buildGuideMeta(manifestEntry),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
