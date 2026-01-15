// src/routes/guides/what-to-pack-amalfi-coast.tsx
import { defineGuideRoute, type GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type {} from "@/routes/guides/_GuideSeoTemplate";

import GenericContent from "@/components/guides/GenericContent";
import GuideSectionsItemListStructuredData from "@/components/seo/GuideSectionsItemListStructuredData";
import i18n from "@/i18n";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

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
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer error message
  throw new Error("guide manifest entry missing for whatToPack");
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
  links: ({ data }, entry) => {
    const candidate = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(candidate.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(entry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, entry.key)}`;
    let origin = BASE_URL;
    try {
      origin = new URL(BASE_URL).origin;
    } catch {
      origin = BASE_URL.replace(/\/+$/, "");
    }
    return buildSeoLinks({ lang, origin, path }).map(({ hrefLang, ...descriptor }) =>
      hrefLang ? { ...descriptor, hreflang: hrefLang } : descriptor,
    );
  },
});

export default Component;
export { clientLoader, meta, links };

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
  const intro = guideContent.intro;
  if (Array.isArray(intro) && intro.some((value) => isMeaningfulString(value))) {
    return true;
  }
  const sections = guideContent.sections;
  if (Array.isArray(sections) && sections.some((entry) => isMeaningfulSectionRecord(entry))) {
    return true;
  }
  return false;
}

function isMeaningfulSectionRecord(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const record = entry as Record<string, unknown>;
  if (isMeaningfulString(record.title)) return true;
  const body = record.body;
  if (Array.isArray(body) && body.some((value) => isMeaningfulString(value))) {
    return true;
  }
  return false;
}

function isMeaningfulString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== GUIDE_KEY;
}