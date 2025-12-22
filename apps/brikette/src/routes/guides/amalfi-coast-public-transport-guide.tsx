// src/routes/guides/amalfi-coast-public-transport-guide.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";
import type { TFunction } from "i18next";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import { buildStructuredFallback } from "./guide-seo/utils/fallbacks";
import RenderFallbackStructured from "./guide-seo/components/fallback/RenderFallbackStructured";

import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { LinksFunction, MetaFunction } from "react-router";
import i18n from "@/i18n";

export const handle = { tags: ["transport", "bus", "ferry", "train", "amalfi", "positano"] };

export const GUIDE_KEY: GuideKey = "publicTransportAmalfi";
export const GUIDE_SLUG = "amalfi-coast-public-transport-guide" as const;

const PREFER_MANUAL_WHEN_UNLOCALIZED = true;
const SUPPRESS_UNLOCALIZED_FALLBACK = true;

function buildArticleLead(ctx: GuideSeoTemplateContext): JSX.Element | null {
  const hasLocalizedStructured =
    (ctx.intro?.length ?? 0) > 0 || (ctx.sections?.length ?? 0) > 0;
  if (hasLocalizedStructured) return null;

  const fallback = buildStructuredFallback(
    GUIDE_KEY,
    ctx.lang,
    undefined,
    i18n as unknown as { getFixedT?: (lng: string, ns: string) => unknown },
    ctx.hasLocalizedContent,
    false,
    (key, opts) => ctx.translateGuides(key as never, opts as never),
  );

  if (!fallback) return null;

  const shouldDeduplicateSections = PREFER_MANUAL_WHEN_UNLOCALIZED && !SUPPRESS_UNLOCALIZED_FALLBACK;

  const articleLeadFallback = shouldDeduplicateSections
    ? {
        ...fallback,
        // Prevent duplicate section rendering when the template already surfaces
        // structured fallback sections (and their ToC) before the article lead.
        // The lead should focus on intro copy + FAQs so fallback headings like
        // "Ferry tips" only appear once. Clone the fallback to avoid mutating the
        // shared object passed to other renderers.
        sections: [],
      }
    : fallback;

  return (
    <RenderFallbackStructured
      fallback={articleLeadFallback}
      context={ctx}
      guideKey={GUIDE_KEY}
      t={ctx.translateGuides}
      showTocWhenUnlocalized={PREFER_MANUAL_WHEN_UNLOCALIZED}
      suppressTocTitle={false}
      preferManualWhenUnlocalized={PREFER_MANUAL_WHEN_UNLOCALIZED}
    />
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for publicTransportAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const { Component, clientLoader, meta: baseMeta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleLead: buildArticleLead,
    preferManualWhenUnlocalized: PREFER_MANUAL_WHEN_UNLOCALIZED,
    suppressUnlocalizedFallback: SUPPRESS_UNLOCALIZED_FALLBACK,
    guideFaqFallback: (lang) => {
      const translator = i18n.getFixedT(lang, "guides") as TFunction<"guides">;
      const entries = translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown;
      if (!Array.isArray(entries)) return [];
      return entries
        .map((item) => {
          const q = typeof item?.q === "string" ? item.q.trim() : "";
          const a = Array.isArray(item?.a)
            ? (item!.a as unknown[]).filter((ans) => typeof ans === "string" && ans.trim().length > 0)
            : [];
          return q && a.length > 0 ? { question: q, answer: a as string[] } : null;
        })
        .filter((item): item is { question: string; answer: string[] } => item != null);
    },
    relatedGuides: {
      items: manifestEntry.relatedGuides.map((key) => ({ key })),
    },
    alsoHelpful: {
      tags: ["transport", "bus", "ferry", "train", "positano"],
      excludeGuide: manifestEntry.relatedGuides,
      includeRooms: true,
    },
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides", "guidesFallback"], { fallbackOptional: false });
    await i18n.changeLanguage(lang);
    await ensureGuideContent(lang, manifestEntry.contentKey, {
      en: () => import(`../../locales/en/guides/content/${manifestEntry.contentKey}.json`),
      local:
        lang === "en"
          ? undefined
          : () =>
              import(`../../locales/${lang}/guides/content/${manifestEntry.contentKey}.json`).catch(
                () => undefined,
              ),
    });
    return { lang };
  },
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (...args) => baseMeta(...args);
export const links: LinksFunction = () => buildRouteLinks();
