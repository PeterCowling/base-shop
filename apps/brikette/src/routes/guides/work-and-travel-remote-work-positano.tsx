// src/routes/guides/work-and-travel-remote-work-positano.tsx
import type { ComponentProps } from "react";

import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { LinksFunction } from "react-router";

import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { buildLinks as buildSeoLinks } from "@/utils/seo";

export const handle = { tags: ["digital-nomads", "work-life", "positano"] };

export const GUIDE_KEY: GuideKey = "workAndTravelPositano";
export const GUIDE_SLUG = "work-and-travel-remote-work-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(
    `guide manifest entry missing for ${GUIDE_KEY}`,
  ); // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error copy only surfaced in build logs
}

type GuideSeoTemplateProps = ComponentProps<typeof GuideSeoTemplate>;
type OgImageConfig = NonNullable<GuideSeoTemplateProps["ogImage"]>;

const OG_IMAGE_OVERRIDE: OgImageConfig = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
};

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE_OVERRIDE,
  }),
  meta: (args, entry) => {
    const data = (args?.data ?? {}) as { lang?: AppLanguage };
    const lang = data.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const imageSrc = buildCfImageUrl(OG_IMAGE_OVERRIDE.path, {
      width: OG_IMAGE_OVERRIDE.width,
      height: OG_IMAGE_OVERRIDE.height,
    });

    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: {
        src: imageSrc,
        width: OG_IMAGE_OVERRIDE.width,
        height: OG_IMAGE_OVERRIDE.height,
      },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args: Parameters<LinksFunction>[0], entry) => {
    const dataLang = typeof (args?.data as { lang?: unknown } | null | undefined)?.lang === "string"
      ? ((args?.data as { lang?: string } | null | undefined)?.lang ?? undefined)
      : undefined;
    const params = args?.params;
    const request = args?.request;
    const paramLang = typeof params?.["lang"] === "string" ? params["lang"] : undefined;
    const lang = toAppLanguage(dataLang ?? paramLang ?? undefined);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;

    let origin = BASE_URL;
    if (request) {
      try {
        origin = new URL(request.url).origin;
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

export { clientLoader };
export { meta, links };
