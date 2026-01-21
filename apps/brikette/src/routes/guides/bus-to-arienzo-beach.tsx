// src/routes/guides/bus-to-arienzo-beach.tsx
import type { LinksFunction } from "react-router";

import ImageGallery from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import EN_ARIENZO_GUIDE from "@/locales/en/guides/content/hostelBriketteToArienzoBus.json";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

export const GUIDE_KEY = "hostelBriketteToArienzoBus" satisfies GuideKey;
export const GUIDE_SLUG = "bus-to-arienzo-beach" as const;

const SCAN_TO_SHARE_IMAGES = [
  { src: "/img/guides/hostel-brikette-to-arienzo-bus/image1.jpg", width: 1200, height: 800 },
  { src: "/img/guides/hostel-brikette-to-arienzo-bus/image2.jpg", width: 1200, height: 800 },
  { src: "/img/guides/hostel-brikette-to-arienzo-bus/image3.jpg", width: 1200, height: 800 },
] as const;

// i18n-exempt -- anchor identifier for in-page navigation
const SCAN_TO_SHARE_SECTION_ID = "scan-to-share" as const;

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

export const handle = { tags: ["beaches", "bus", "positano"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for hostelBriketteToArienzoBus"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "positanoBeaches" },
        { key: "lauritoBeachBusBack" },
        { key: "positanoMainBeachBusDown" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "positano", "bus"],
      excludeGuide: ["positanoBeaches", "lauritoBeachBusBack", "positanoMainBeachBusDown"],
      includeRooms: true,
    },
    afterArticle: ({ translateGuides }) => {
      const scanToShare = resolveScanToShareContent(translateGuides);
      if (!scanToShare.heading && scanToShare.items.length === 0) return null;
      return (
        <section id={SCAN_TO_SHARE_SECTION_ID}>
          {scanToShare.heading ? <h2>{scanToShare.heading}</h2> : null}
          {scanToShare.items.length > 0 ? <ImageGallery items={scanToShare.items} /> : null}
        </section>
      );
    },
  }),
  meta: ({ data }, entry) => {
    const lang = ((data as { lang?: AppLanguage } | undefined)?.lang ?? "en") as AppLanguage;
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();

function pickMeaningfulString(
  candidate: string | null | undefined,
  fallbackCandidate: string | null | undefined,
): string | null {
  const pick = (value: string | null | undefined): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  return pick(candidate) ?? pick(fallbackCandidate);
}

function resolveScanToShareContent(
  translateGuides: (key: string, options?: Record<string, unknown>) => unknown,
): { heading: string | null; items: Array<{ src: string; width: number; height: number; alt: string }> } {
  const baseKey = `content.${GUIDE_KEY}.afterArticle`;

  const rawHeadingPrimary = translateGuides(`${baseKey}.scanToShareHeading`) as unknown;
  const rawHeadingFallback = translateGuides(`${baseKey}.scanToShareHeading`, { lng: "en" }) as unknown;
  const fallbackFromJson = (EN_ARIENZO_GUIDE as unknown as {
    afterArticle?: { scanToShareHeading?: unknown; scanToShareGalleryAlt?: unknown };
  }).afterArticle;

  const heading =
    pickMeaningfulString(
      typeof rawHeadingPrimary === "string" ? rawHeadingPrimary : null,
      typeof rawHeadingFallback === "string" ? rawHeadingFallback : null,
    ) ??
    (typeof fallbackFromJson?.scanToShareHeading === "string"
      ? pickMeaningfulString(fallbackFromJson.scanToShareHeading, null)
      : null);

  const rawAltPrimary = translateGuides(`${baseKey}.scanToShareGalleryAlt`, { returnObjects: true }) as unknown;
  const rawAltFallback = translateGuides(`${baseKey}.scanToShareGalleryAlt`, {
    lng: "en",
    returnObjects: true,
  }) as unknown;

  const toStringArray = (value: unknown): Array<string | null> => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => (typeof item === "string" ? item : null));
  };

  const primaryAlt = toStringArray(rawAltPrimary);
  const fallbackAlt = toStringArray(rawAltFallback);

  const items: Array<{ src: string; width: number; height: number; alt: string }> = [];
  SCAN_TO_SHARE_IMAGES.forEach((image, index) => {
    const jsonAltArray = Array.isArray(fallbackFromJson?.scanToShareGalleryAlt)
      ? (fallbackFromJson?.scanToShareGalleryAlt as Array<unknown>)
      : [];
    const jsonAlt = typeof jsonAltArray[index] === "string" ? (jsonAltArray[index] as string) : null;
    const alt = pickMeaningfulString(primaryAlt[index], fallbackAlt[index]) ?? pickMeaningfulString(jsonAlt, null);
    if (alt) items.push({ ...image, alt });
  });

  return { heading, items };
}
