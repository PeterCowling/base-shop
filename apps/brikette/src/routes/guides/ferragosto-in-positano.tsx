// src/routes/guides/ferragosto-in-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import EventInfo from "@/components/guides/EventInfo";
import EventStructuredData from "@/components/seo/EventStructuredData";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import getFallbackLanguage from "./utils/getFallbackLanguage";

type GuideLinksArgs = Parameters<LinksFunction>[0];
type GuideMetaArgs = Parameters<MetaFunction>[0];

type GuideLinksContext = {
  data?: { lang?: unknown } | null;
  params?: { lang?: unknown } | null;
  request?: { url?: unknown } | null;
};

export const handle = { tags: ["event", "seasonal", "positano"] };

export const GUIDE_KEY = "ferragostoPositano" as const;
export const GUIDE_SLUG = "ferragosto-in-positano" as const;

type EventDetails = {
  date?: string;
  location?: string;
  tips?: string[];
};

type EventTranslation = {
  date?: unknown;
  location?: unknown;
  tips?: unknown;
};

type GuidesTranslator = (key: string, options?: Record<string, unknown>) => unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

export function extractEventDetails(raw: unknown): EventDetails | undefined {
  if (!isRecord(raw)) return undefined;
  const candidates = [raw["event"], raw["eventInfo"]].filter((candidate) => candidate !== undefined);
  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const source = candidate as EventTranslation;
    const date = toNonEmptyString(source.date);
    const location = toNonEmptyString(source.location);
    const tips = toStringArray(source.tips);
    if (date || location || tips.length > 0) {
      return {
        ...(date ? { date } : {}),
        ...(location ? { location } : {}),
        ...(tips.length > 0 ? { tips } : {}),
      } satisfies EventDetails;
    }
  }
  return undefined;
}

function getEnglishTranslator(context: GuideSeoTemplateContext): GuidesTranslator | undefined {
  if (typeof context.translateGuidesEn === "function") {
    return context.translateGuidesEn;
  }
  try {
    const fixed = i18n.getFixedT("en", "guides");
    if (typeof fixed === "function") {
      return fixed as GuidesTranslator;
    }
  } catch {
    /* noop */
  }
  try {
    const fallback = (i18n as unknown as {
      __tGuidesFallback?: GuidesTranslator;
    }).__tGuidesFallback;
    if (typeof fallback === "function") {
      return fallback;
    }
  } catch {
    /* noop */
  }
  return undefined;
}

const ArticleLead = (context: GuideSeoTemplateContext) => {
  const translationKey = `content.${GUIDE_KEY}`;
  const raw = context.translateGuides(translationKey, { returnObjects: true }) as unknown;
  let details = extractEventDetails(raw);
  if (!details) {
    const englishTranslator = getEnglishTranslator(context);
    if (englishTranslator) {
      const fallbackRaw = englishTranslator(translationKey, { returnObjects: true });
      details = extractEventDetails(fallbackRaw);
    }
  }
  if (!details) return null;
  const eventProps = {
    ...(typeof details.date === "string" ? { date: details.date } : {}),
    ...(typeof details.location === "string" ? { location: details.location } : {}),
    ...(Array.isArray(details.tips) ? { tips: details.tips } : {}),
  };
  return <EventInfo {...eventProps} />;
};

const AdditionalScripts = (context: GuideSeoTemplateContext) => (
  <EventStructuredData
    name={String(context.article.title)}
    startDate="2025-08-15"
    locationName="Positano"
    addressLocality="Positano"
    description={String(context.article.description)}
  />
);

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for ferragostoPositano"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only invariant surfaced in build logs
}

const resolveMeta = (args: GuideMetaArgs): ReturnType<MetaFunction> => {
  const lang = toAppLanguage((args?.data as { lang?: string } | undefined)?.lang ?? getFallbackLanguage());
  const path = guideHref(lang, manifestEntry.key);
  const url = guideAbsoluteUrl(lang, manifestEntry.key);
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
    url,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

const resolveLinks = (args?: GuideLinksArgs): ReturnType<LinksFunction> => {
  const safeArgs = (args ?? {}) as GuideLinksContext;
  const dataLang = typeof safeArgs?.data?.lang === "string" ? safeArgs.data.lang : undefined;
  const paramLang = typeof safeArgs?.params?.["lang"] === "string" ? safeArgs.params["lang"] : undefined;
  const lang = toAppLanguage(dataLang ?? paramLang ?? getFallbackLanguage());
  const path = guideHref(lang, manifestEntry.key);
  const url = guideAbsoluteUrl(lang, manifestEntry.key);
  const requestUrl = typeof safeArgs?.request?.url === "string" ? safeArgs.request.url : undefined;
  const origin = (() => {
    if (!requestUrl) return undefined;
    try {
      return new URL(requestUrl).origin;
    } catch {
      return undefined;
    }
  })();
  return buildRouteLinks({ lang, path, url, ...(origin ? { origin } : {}) });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleLead: ArticleLead,
    additionalScripts: AdditionalScripts,
    relatedGuides: { items: [{ key: "bestTimeToVisit" }, { key: "sunsetViewpoints" }, { key: "beaches" }] },
  }),
  meta: resolveMeta,
  links: resolveLinks,
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (args) => resolveMeta(args);
export const links: LinksFunction = (
  ...linkArgs: Parameters<LinksFunction>
) => {
  const [firstArg] = linkArgs;
  return resolveLinks(firstArg);
};
