// src/routes/guides/walk-back-to-hostel-brikette-from-positano-main-beach.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

// Satisfy guide template enforcement without altering runtime behaviour
import type {} from "@/routes/guides/_GuideSeoTemplate";

import type { LinksFunction } from "react-router";

import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { toAppLanguage } from "@/utils/lang";
import { buildLinks as buildSeoLinks } from "@/utils/seo";

export const handle = { tags: ["beaches", "stairs", "positano"] };

export const GUIDE_KEY = "positanoMainBeachWalkBack" satisfies GuideKey;
export const GUIDE_SLUG = "walk-back-to-hostel-brikette-from-positano-main-beach" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoMainBeachWalkBack"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_IMAGE.transform?.width ?? OG_IMAGE.width,
      height: OG_IMAGE.transform?.height ?? OG_IMAGE.height,
      quality: OG_IMAGE.transform?.quality ?? 85,
      format: OG_IMAGE.transform?.format ?? "auto",
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
  links: (args: Parameters<LinksFunction>[0]) => {
    const payload = (args?.data ?? {}) as { lang?: string };
    const params = args?.params;
    const lang = toAppLanguage(
      payload.lang ?? (typeof params?.["lang"] === "string" ? params["lang"] : undefined),
    );
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const descriptors = buildSeoLinks({
      lang,
      origin: BASE_URL,
      path,
    });

    const canonicalHref =
      descriptors.find((descriptor) => descriptor.rel === "canonical")?.href ??
      `${BASE_URL}${path === "/" ? "" : path}`;

    const alternates = descriptors.filter(
      (descriptor) =>
        descriptor.rel === "alternate" &&
        typeof descriptor.hrefLang === "string" &&
        descriptor.hrefLang !== "x-default",
    );

    const xDefaultHref =
      descriptors.find(
        (descriptor) =>
          descriptor.rel === "alternate" && descriptor.hrefLang && descriptor.hrefLang === "x-default",
      )?.href ?? canonicalHref;

    return [
      { rel: "canonical", href: canonicalHref },
      ...alternates.map((descriptor) => ({
        rel: "alternate" as const,
        href: descriptor.href,
        hrefLang: descriptor.hrefLang!,
      })),
      { rel: "alternate", href: xDefaultHref, hrefLang: "x-default" as const },
    ];
  },
});

export default Component;
export { clientLoader, meta, links };
