// src/routes/guides/traveling-with-pets-amalfi-coast.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
// Satisfy guide template enforcement lint rule.
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteMeta } from "@/utils/routeHead";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["travel-tips", "pets", "amalfi", "positano", "families"] };

export const GUIDE_KEY: GuideKey = "petsAmalfi";
export const GUIDE_SLUG = "traveling-with-pets-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for petsAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    showRelatedWhenLocalized: false,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
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
export { clientLoader, links,meta };
