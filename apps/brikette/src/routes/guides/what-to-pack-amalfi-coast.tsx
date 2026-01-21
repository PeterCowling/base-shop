// src/routes/guides/what-to-pack-amalfi-coast.tsx
import type { LinksFunction } from "react-router";

import GenericContent from "@/components/guides/GenericContent";
import GuideSectionsItemListStructuredData from "@/components/seo/GuideSectionsItemListStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteMeta } from "@/utils/routeHead";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["travel-tips", "packing", "amalfi"] } as const;

export const GUIDE_KEY = "whatToPack" as const satisfies GuideKey;
export const GUIDE_SLUG = "what-to-pack-amalfi-coast" as const;

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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for whatToPack"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    renderGenericContent: false,
    relatedGuides: {
      items: [
        { key: "pathOfTheGods" },
        { key: "sunsetViewpoints" },
        { key: "positanoBeaches" },
      ],
    },
    articleLead: (context) => renderWhatToPackContent(context),
    additionalScripts: (context) =>
      hasLocalizedCopy(context) ? (
        <GuideSectionsItemListStructuredData
          guideKey={GUIDE_KEY}
          name={String(context.article.title ?? "")}
          canonicalUrl={context.canonicalUrl}
        />
      ) : null,
  }),
  meta: ({ data }, entry) => {
    const candidate = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(candidate.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_DIMS.width,
      height: OG_DIMS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_DIMS.width, height: OG_DIMS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args: Parameters<LinksFunction>[0], entry) => {
    const candidate = (args?.data ?? {}) as { lang?: string };
    const params = args?.params;
    const lang = toAppLanguage(
      candidate.lang ?? (typeof params?.["lang"] === "string" ? params["lang"] : undefined),
    );
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
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

function renderWhatToPackContent(context: GuideSeoTemplateContext) {
  if (!hasLocalizedCopy(context)) {
    return null;
  }
  const hasIntro = Array.isArray(context.intro) && context.intro.length > 0;
  const hasSections = Array.isArray(context.sections) && context.sections.length > 0;
  if (!hasIntro && !hasSections) return null;
  const renderGeneric = GenericContent as unknown as (
    props: Parameters<typeof GenericContent>[0],
    translator?: unknown,
  ) => ReturnType<typeof GenericContent>;
  return renderGeneric(
    { guideKey: GUIDE_KEY, showToc: true, t: context.translateGuides },
    context.translateGuides,
  );
}

function hasLocalizedCopy(context: GuideSeoTemplateContext): boolean {
  if (context.lang === "en") {
    return true;
  }
  const bundle = i18n.getResourceBundle(context.lang, "guides") as
    | { content?: Record<string, unknown> }
    | undefined;
  const content = bundle?.content;
  if (!content || typeof content !== "object") {
    return false;
  }
  const guideContent = content[GUIDE_KEY] as Record<string, unknown> | undefined;
  if (!guideContent) return false;
  const intro = guideContent["intro"];
  if (Array.isArray(intro) && intro.some((value) => isMeaningfulString(value))) {
    return true;
  }
  const sections = guideContent["sections"];
  if (Array.isArray(sections) && sections.some((entry) => isMeaningfulSectionRecord(entry))) {
    return true;
  }
  return false;
}

function isMeaningfulSectionRecord(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const record = entry as Record<string, unknown>;
  if (isMeaningfulString(record["title"])) return true;
  const body = record["body"];
  if (Array.isArray(body) && body.some((value) => isMeaningfulString(value))) {
    return true;
  }
  return false;
}

function isMeaningfulString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== GUIDE_KEY;
}
