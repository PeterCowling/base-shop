// src/routes/guides/marina-di-praia-and-secluded-beaches.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";

import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import type { MetaFunction } from "react-router";

// Satisfy template-enforcement lint rule without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";

export const handle = { tags: ["beaches", "praiano", "furore", "hidden-gems", "positano"] };

export const GUIDE_KEY = "marinaDiPraiaBeaches" as const satisfies GuideKey;
export const GUIDE_SLUG = "marina-di-praia-and-secluded-beaches" as const;

const OG_IMAGE = {
  path: "/img/hostel-communal-terrace-lush-view.webp",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto" as const,
  },
} as const;

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(areaSlugKey, lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
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
if (!manifestEntry) throw new Error("guide manifest entry missing for marinaDiPraiaBeaches"); // i18n-exempt -- DEV-000 [ttl=2099-12-31]

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: {
      items: [
        { key: "praianoGuide" },
        { key: "beachHoppingAmalfi" },
        { key: "positanoBeaches" },
      ],
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
  links: (args) => {
    const safeArgs = (args ?? {}) as {
      data?: { lang?: unknown } | null;
      params?: { lang?: unknown } | null;
      request?: { url?: unknown } | null;
    };

    const dataLang = typeof safeArgs.data?.lang === "string" ? safeArgs.data.lang : undefined;
    const paramLang = typeof safeArgs.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;

    const lang = toAppLanguage(dataLang ?? paramLang ?? undefined);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;

    let origin = BASE_URL;
    const requestUrl = typeof safeArgs.request?.url === "string" ? safeArgs.request.url : undefined;

    if (requestUrl) {
      try {
        origin = new URL(requestUrl).origin;
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

export function resolveMarinaString(
  translator: ((key: string) => unknown) | null | undefined,
  key: string,
): string | undefined {
  if (!translator) return undefined;
  const value = translator(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return undefined;
  return trimmed;
}

export function pickMarinaContentTranslator<Fn extends (...args: unknown[]) => unknown>(
  primaryMetricA: unknown,
  primaryMetricB: unknown,
  primaryMetricC: unknown,
  fallbackMetricA: unknown,
  fallbackMetricB: unknown,
  fallbackMetricC: unknown,
  primary: Fn,
  fallback: Fn,
): Fn | null {
  const primaryHas = [primaryMetricA, primaryMetricB, primaryMetricC].some((v) => Number(v) > 0);
  const fallbackHas = [fallbackMetricA, fallbackMetricB, fallbackMetricC].some((v) => Number(v) > 0);
  if (primaryHas) return primary;
  if (fallbackHas) return fallback;
  return null;
}
