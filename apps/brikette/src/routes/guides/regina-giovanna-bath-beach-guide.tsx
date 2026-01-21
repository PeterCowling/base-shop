// src/routes/guides/regina-giovanna-bath-beach-guide.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteMeta } from "@/utils/routeHead";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["beaches", "sorrento", "day-trip"] } as const;

export const GUIDE_KEY = "reginaGiovannaBath" satisfies GuideKey;
export const GUIDE_SLUG = "regina-giovanna-bath-beach-guide" as const;

const OG_IMAGE_CONFIG = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  transform: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  },
} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for reginaGiovannaBath"); // i18n-exempt -- DEV-000 [ttl=2099-12-31]

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_CONFIG.path, OG_IMAGE_CONFIG.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE_CONFIG.width, height: OG_IMAGE_CONFIG.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args: Parameters<LinksFunction>[0], entry) => {
    const payload = (args?.data ?? {}) as { lang?: string };
    const lang = toAppLanguage(
      payload.lang ?? (typeof args?.params?.["lang"] === "string" ? args.params["lang"] : undefined),
    );
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;

    let origin = BASE_URL;
    if (args?.request) {
      try {
        origin = new URL(args.request.url).origin;
      } catch {
        origin = BASE_URL;
      }
    }

    const descriptors = buildSeoLinks({
      lang,
      origin,
      path,
    });

    const canonicalHref =
      descriptors.find((descriptor) => descriptor.rel === "canonical")?.href ??
      `${origin}${path === "/" ? "" : path}`;

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
export { clientLoader, links,meta };
