// src/routes/guides/positano-instagram-spots.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { createElement, type ComponentType } from "react";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import type { LinksFunction } from "react-router";
import type { TFunction } from "i18next";

import GenericContent from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";

import FallbackArticle from "./positano-instagram-spots/_FallbackArticle";
import { buildGuideFaqFallback } from "./positano-instagram-spots/buildGuideFaqFallback";
import { createFallbackData } from "./positano-instagram-spots/createFallbackData";
import * as IG from "./positano-instagram-spots/constants";

export const handle = { tags: ["photography", "viewpoints", "positano"] };
export const GUIDE_KEY = IG.GUIDE_KEY;
export const GUIDE_SLUG = IG.GUIDE_SLUG;

type MaybeMockedComponent<P extends Record<string, unknown>> = ComponentType<P> & { mock?: unknown };

function renderMaybeMocked<P extends Record<string, unknown>>(
  Component: MaybeMockedComponent<P>,
  props: P,
): JSX.Element | null {
  if (typeof Component.mock === "object") {
    return (Component as unknown as (props: P, context?: unknown) => JSX.Element | null)(
      props,
      {} as unknown as never,
    );
  }

  return createElement(Component as ComponentType<P>, props);
}

function renderGenericContent(context: GuideSeoTemplateContext): JSX.Element | null {
  return renderMaybeMocked(GenericContent, { t: context.translator, guideKey: IG.GUIDE_KEY });
}

function buildArticleLead(context: GuideSeoTemplateContext): JSX.Element | null {
  if (context.hasLocalizedContent) {
    return renderGenericContent(context);
  }

  const fallbackData = createFallbackData(context.lang as AppLanguage);
  if (!fallbackData.hasContent) {
    return renderGenericContent(context);
  }

  return renderMaybeMocked(FallbackArticle, {
    data: fallbackData,
    lang: context.lang as AppLanguage,
    translator: context.translator as unknown as TFunction<"guides">,
  });
}

function buildTocItems(context: GuideSeoTemplateContext) {
  if (context.hasLocalizedContent) {
    return context.toc;
  }
  const fallbackData = createFallbackData(context.lang as AppLanguage);
  return fallbackData.toc;
}

function buildFaqFallback(lang: string): NormalizedFaqEntry[] | undefined {
  const fallback = buildGuideFaqFallback(lang as AppLanguage);
  if (!Array.isArray(fallback) || fallback.length === 0) {
    return undefined;
  }

  return fallback
    .map(({ q, a }) => ({
      question: q.trim(),
      answer: a.map((answer) => answer.trim()).filter((answer) => answer.length > 0),
    }))
    .filter((entry): entry is NormalizedFaqEntry => entry.question.length > 0 && entry.answer.length > 0);
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for instagramSpots"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: IG.OG_IMAGE,
    renderGenericContent: false,
    articleLead: buildArticleLead,
    buildTocItems,
    guideFaqFallback: buildFaqFallback,
    relatedGuides: { items: [{ key: "sunsetViewpoints" }, { key: "beaches" }, { key: "positanoTravelGuide" }] },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(IG.OG_IMAGE.path, IG.OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: IG.OG_IMAGE.width, height: IG.OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return descriptors.length > 0 ? descriptors : buildRouteLinks();
};

export default Component;
export { clientLoader, meta, links };
