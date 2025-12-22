// src/routes/guides/inside-a-limoncello-factory-amalfi-coast.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { DEFAULT_OG_IMAGE } from "./guide-seo/constants";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { buildLinks as buildSeoLinks } from "@/utils/seo";

export const handle = { tags: ["cuisine", "amalfi", "praiano"] };

export const GUIDE_KEY = "limoncelloFactory" as const satisfies GuideKey;
export const GUIDE_SLUG = "inside-a-limoncello-factory-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry)
  throw new Error("guide manifest entry missing for limoncelloFactory"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    suppressUnlocalizedFallback: true,
    articleLead: (ctx: GuideSeoTemplateContext) => {
      if (ctx.hasLocalizedContent) return null;
      try {
        const key = `content.${GUIDE_KEY}.fallbackParagraph` as const;
        const raw = ctx.translateGuides(key) as unknown;
        const paragraph = typeof raw === "string" ? raw.trim() : "";
        if (!paragraph || paragraph === key) return null;
        return (
          <div className="space-y-4">
            <p>{paragraph}</p>
          </div>
        );
      } catch {
        return null;
      }
    },
    relatedGuides: {
      items: [
        { key: "limoncelloCuisine" },
        { key: "cuisineAmalfiGuide" },
        { key: "tramontiWineries" },
      ],
    },
  }),
  meta: ({ data }, entry) => {
    const candidate = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(candidate.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const image = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    });

    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args, entry) => {
    const { data, params, request } = args ?? {};
    const candidate = (data ?? {}) as { lang?: string };
    const paramsRecord = (params ?? {}) as { lang?: unknown };
    const lang = toAppLanguage(
      candidate.lang ?? (typeof paramsRecord.lang === "string" ? paramsRecord.lang : undefined),
    );
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
export { clientLoader, meta, links };
