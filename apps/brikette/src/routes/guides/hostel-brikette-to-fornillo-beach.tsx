// src/routes/guides/hostel-brikette-to-fornillo-beach.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { CfImage } from "@/components/images/CfImage";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl,guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";

export const handle = { tags: ["beaches", "stairs", "positano"] };

export const GUIDE_KEY = "hostelBriketteToFornilloBeach" satisfies GuideKey;
export const GUIDE_SLUG = "hostel-brikette-to-fornillo-beach" as const;

const SECTION_IMAGES = {
  walkMap: {
    src: "/img/directions/hostel-brikette-to-fornillo-map.jpg",
    width: 473,
    height: 678,
    altKey: "content.hostelBriketteToFornilloBeach.gallery.items.0.alt",
    captionKey: "content.hostelBriketteToFornilloBeach.gallery.items.0.caption",
  },
  turnPhoto: {
    src: "/img/directions/hostel-brikette-to-fornillo-turn.jpg",
    width: 676,
    height: 457,
    altKey: "content.hostelBriketteToFornilloBeach.gallery.items.1.alt",
    captionKey: "content.hostelBriketteToFornilloBeach.gallery.items.1.caption",
  },
  returnMap: {
    src: "/img/directions/fornillo-to-brikette-bus-map.jpg",
    width: 1200,
    height: 1159,
    altKey: "content.hostelBriketteToFornilloBeach.gallery.items.2.alt",
    captionKey: "content.hostelBriketteToFornilloBeach.gallery.items.2.caption",
  },
} as const;

type SectionImageVariant = keyof typeof SECTION_IMAGES;

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

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? ("en" as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for hostelBriketteToFornilloBeach"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, links: baseLinks, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "positanoBeaches" },
        { key: "beachHoppingAmalfi" },
        { key: "positanoTravelGuide" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "positano", "stairs"],
      excludeGuide: ["positanoBeaches", "beachHoppingAmalfi", "positanoTravelGuide"],
      includeRooms: true,
    },
    genericContentOptions: {
      sectionTopExtras: {
        "route-steps": <FornilloSectionFigure variant="walkMap" />,
      },
      sectionBottomExtras: {
        "route-steps": <FornilloSectionFigure variant="turnPhoto" />,
        "return-options": <FornilloSectionFigure variant="returnMap" />,
      },
    },
  }),
  meta: buildMeta(manifestEntry.metaKey ?? manifestEntry.key, manifestEntry.status === "live"),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return Array.isArray(descriptors) && descriptors.length > 0 ? descriptors : buildRouteLinks();
};

type SectionFigureProps = {
  variant: SectionImageVariant;
};

function FornilloSectionFigure({ variant }: SectionFigureProps): JSX.Element {
  const currentLang = useCurrentLanguage();
  const lang = (currentLang ?? i18nConfig.fallbackLng) as AppLanguage;
  const image = SECTION_IMAGES[variant];
  const alt = translateWithFallback(lang, image.altKey);
  const caption = translateWithFallback(lang, image.captionKey);

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

function translateWithFallback(lang: AppLanguage, key: string): string {
  const translate = i18n.getFixedT(lang, "guides");
  const primary = typeof translate === "function" ? translate(key) : key;
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
