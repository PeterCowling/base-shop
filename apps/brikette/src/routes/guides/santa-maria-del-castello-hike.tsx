// src/routes/guides/santa-maria-del-castello-hike.tsx
import type { LinksFunction } from "react-router";

import { CfImage } from "@/components/images/CfImage";
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";

export const handle = { tags: ["hiking", "positano", "viewpoints"] };

export const GUIDE_KEY = "santaMariaDelCastelloHike" as const satisfies GuideKey;
export const GUIDE_SLUG = "santa-maria-del-castello-hike" as const;

const SECTION_IMAGES = {
  overlook: {
    src: "/img/guides/santa-maria-del-castello/positano-overlook.jpg",
    width: 1024,
    height: 602,
    altKey: `content.${GUIDE_KEY}.sectionFigure.alt`,
    captionKey: `content.${GUIDE_KEY}.sectionFigure.caption`,
  },
} as const;

const OG_IMAGE = {
  path: "/img/guides/santa-maria-del-castello/positano-overlook.jpg",
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
}: GuideSectionFigureProps): JSX.Element {
  const copy = useGuideCopyResolver();

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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for santaMariaDelCastelloHike"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    genericContentOptions: {
      sectionTopExtras: {
        "what-is-it": <GuideSectionFigure {...SECTION_IMAGES.overlook} />,
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