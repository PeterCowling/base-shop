// src/routes/guides/hostel-brikette-to-regina-giovanna-bath.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";

import ImageGallery from "@/components/guides/ImageGallery";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta } from "@/utils/routeHead";
import type { AppLanguage } from "@/i18n.config";
import type { MetaFunction } from "react-router";

export const handle = { tags: ["transport", "beaches", "sorrento", "bus"] };

export const GUIDE_KEY = "hostelBriketteToReginaGiovannaBath" satisfies GuideKey;
export const GUIDE_SLUG = "hostel-brikette-to-regina-giovanna-bath" as const;

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

const SCAN_TO_SHARE_IMAGE_PATHS = [
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image1.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image2.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image3.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image4.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image5.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image6.png",
  "/img/guides/hostel-brikette-to-regina-giovanna-bath/image7.png",
] as const;

const SCAN_TO_SHARE_SECTION_ID = "scan-to-share" as const;

type ScanToShareContent = {
  title?: string | null;
  items?: Array<{ alt?: string | null }>;
};

function pickMeaningfulString(candidate: string | null | undefined, fallbackCandidate: string | null | undefined): string | null {
  const pick = (value: string | null | undefined): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  return pick(candidate) ?? pick(fallbackCandidate);
}

export function resolveScanToShareContent(
  translateGuides: (key: string, options?: Record<string, unknown>) => unknown,
): { title: string | null; items: Array<{ src: string; alt: string }> } {
  const key = `content.${GUIDE_KEY}.scanToShare`;
  const primaryRaw = translateGuides(key, { returnObjects: true }) as unknown;
  const fallbackRaw = translateGuides(key, { lng: "en", returnObjects: true }) as unknown;

  const normalise = (value: unknown): ScanToShareContent => {
    if (typeof value !== "object" || value === null) return {};
    const record = value as Record<string, unknown>;
    const itemsValue = record.items;
    const items = Array.isArray(itemsValue)
      ? (itemsValue as Array<{ alt?: string | null }>).map((item) =>
          typeof item === "object" && item !== null ? item : {},
        )
      : undefined;
    return { title: typeof record.title === "string" ? record.title : null, items };
  };

  const primary = normalise(primaryRaw);
  const fallback = normalise(fallbackRaw);

  const title = pickMeaningfulString(primary.title, fallback.title);
  const items = SCAN_TO_SHARE_IMAGE_PATHS.map((src, index) => {
    const primaryItem = primary.items?.[index];
    const fallbackItem = fallback.items?.[index];
    const alt = pickMeaningfulString(primaryItem?.alt ?? null, fallbackItem?.alt ?? null);
    if (!alt) return null;
    return { src, alt };
  }).filter((item): item is { src: (typeof SCAN_TO_SHARE_IMAGE_PATHS)[number]; alt: string } => item != null);

  return { title, items };
}

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = (payload.lang as string | undefined) || "en";
    const path = guideHref(lang as AppLanguage, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang as AppLanguage, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang: lang as AppLanguage,
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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for hostelBriketteToReginaGiovannaBath");

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "reginaGiovannaBath" },
        { key: "naplesCityGuide" },
        { key: "dayTripsAmalfi" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "transport", "sorrento"],
      excludeGuide: ["reginaGiovannaBath", GUIDE_KEY],
      includeRooms: false,
    },
    afterArticle: ({ translateGuides }) => {
      const scanToShare = resolveScanToShareContent(translateGuides);
      if (!scanToShare.title && scanToShare.items.length === 0) return null;
      return (
        <section id={SCAN_TO_SHARE_SECTION_ID}>
          {scanToShare.title ? <h2>{scanToShare.title}</h2> : null}
          {scanToShare.items.length > 0 ? <ImageGallery items={scanToShare.items} /> : null}
        </section>
      );
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta, links };
export const __test__ = { resolveScanToShareContent } as const;