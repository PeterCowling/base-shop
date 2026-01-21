// src/routes/guides/luminaria-di-san-domenico-praiano.tsx
import { memo } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { TFunction } from "i18next";

import EventInfo from "@/components/guides/EventInfo";
import ImageGallery from "@/components/guides/ImageGallery";
import EventStructuredData from "@/components/seo/EventStructuredData";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate from "./_GuideSeoTemplate";

export const handle = { tags: ["event", "seasonal", "amalfi"] };

export const GUIDE_KEY = "luminariaPraiano" as const satisfies GuideKey;
export const GUIDE_SLUG = "luminaria-di-san-domenico-praiano" as const;

// Helpers carried over from previous implementation
export function resolveLuminariaString(
  value: unknown,
  key: string,
  fallback?: unknown,
  defaultValue?: string,
): string | undefined {
  // Consider both fully-qualified (e.g., "structured.x.y") and compact
  // variants (e.g., "x.y") as placeholders so raw keys from fallback paths
  // are not treated as meaningful values.
  const isPlaceholder = (s: string, expectedKey: string): boolean => {
    const trimmed = s.trim();
    if (!trimmed) return true;
    if (trimmed === expectedKey) return true;
    const compact = expectedKey.replace(/^structured\./, "");
    if (trimmed === compact) return true;
    return false;
  };

  if (typeof value === "string" && value.trim().length > 0 && !isPlaceholder(value, key)) {
    return value;
  }
  if (typeof fallback === "string" && fallback.trim().length > 0 && !isPlaceholder(fallback, key)) {
    return fallback;
  }
  return defaultValue;
}

export function hasLuminariaStructuredContent(
  introAny: unknown,
  sectionsAny: unknown,
  faqsAny: unknown,
): boolean {
  return (
    (Array.isArray(introAny) && introAny.length > 0) ||
    (Array.isArray(sectionsAny) && sectionsAny.length > 0) ||
    (Array.isArray(faqsAny) && faqsAny.length > 0)
  );
}

export type LuminariaEvent = { date?: string; location?: string; tips?: string[] };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

export function normaliseLuminariaEvent(
  eventAny: unknown,
  fallbackAny: unknown,
): LuminariaEvent | undefined {
  const local = asRecord(eventAny) ?? {};
  const fallback = asRecord(fallbackAny) ?? {};

  const placeholderPatterns = [
    /traduzion/iu,
    /arriving\s+(soon)?/iu,
    /coming\s+soon/iu,
    /pending/iu,
  ] as const;
  const isPlaceholder = (s: string) => {
    const normalised = s.trim().toLowerCase();
    if (!normalised) return true;
    return placeholderPatterns.some((pattern) => pattern.test(normalised));
  };

  const pickField = (localVal: unknown, fallbackVal: unknown, key: string): string | undefined => {
    const lRaw = typeof localVal === "string" ? localVal : "";
    const lTrim = typeof localVal === "string" ? localVal.trim() : "";
    if (lTrim && lTrim !== key && !isPlaceholder(lTrim)) return lRaw;
    const fRaw = typeof fallbackVal === "string" ? fallbackVal : "";
    const fTrim = typeof fallbackVal === "string" ? fallbackVal.trim() : "";
    if (fTrim && fTrim !== key) return fRaw;
    return undefined;
  };

  const date = pickField(local["date"], fallback["date"], `content.${GUIDE_KEY}.event.date`);
  const location = pickField(local["location"], fallback["location"], `content.${GUIDE_KEY}.event.location`);
  const normaliseTips = (source: unknown): string[] => {
    if (!Array.isArray(source)) return [];
    return source
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((t) => t.length > 0 && !isPlaceholder(t));
  };

  const localTips = normaliseTips(local["tips"]);
  const fallbackTips = normaliseTips(fallback["tips"]);
  const tips = localTips.length > 0 ? localTips : fallbackTips;

  if (!date && !location && tips.length === 0) return undefined;
  return {
    ...(date ? { date } : {}),
    ...(location ? { location } : {}),
    ...(tips.length > 0 ? { tips } : {}),
  };
}

export type LuminariaStructured = {
  name: string;
  startDate: string;
  endDate?: string;
  locationName: string;
  addressLocality: string;
  description: string;
};

export function deriveLuminariaStructuredData(
  local: Record<string, unknown> | undefined,
  fallback: Record<string, unknown> | undefined,
  title: string,
  description: string,
  eventLocation?: string,
): LuminariaStructured {
  const localSource = local ?? {};
  const fallbackSource = fallback ?? {};

  const name = resolveLuminariaString(
    localSource["name"],
    `structured.${GUIDE_KEY}.name`,
    fallbackSource["name"],
    title,
  ) ?? title;
  const startDate = (
    resolveLuminariaString(
      localSource["startDate"],
      `structured.${GUIDE_KEY}.startDate`,
      fallbackSource["startDate"],
      fallbackSource["startDate"] as string | undefined,
    ) ?? (fallbackSource["startDate"] as string)
  ) as string;
  const endDate = resolveLuminariaString(
    localSource["endDate"],
    `structured.${GUIDE_KEY}.endDate`,
    fallbackSource["endDate"],
    fallbackSource["endDate"] as string | undefined,
  );
  const locationName = (
    resolveLuminariaString(
      localSource["locationName"],
      `structured.${GUIDE_KEY}.locationName`,
      fallbackSource["locationName"],
      eventLocation,
    ) ?? eventLocation ?? (fallbackSource["locationName"] as string)
  ) as string;
  const addressLocality = (
    resolveLuminariaString(
      localSource["addressLocality"],
      `structured.${GUIDE_KEY}.addressLocality`,
      fallbackSource["addressLocality"],
      fallbackSource["addressLocality"] as string | undefined,
    ) ?? (fallbackSource["addressLocality"] as string)
  ) as string;
  const structuredDescription = (
    resolveLuminariaString(
      localSource["description"],
      `structured.${GUIDE_KEY}.description`,
      fallbackSource["description"],
      description,
    ) ?? description
  ) as string;

  return {
    name,
    startDate,
    ...(endDate ? { endDate } : {}),
    locationName,
    addressLocality,
    description: structuredDescription,
  } satisfies LuminariaStructured;
}

function LuminariaPraiano(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      // When localized content is empty, prefer rendering GenericContent
      // backed by the English structured guides translator so tests can
      // assert EN-derived copy via the GenericContent path.
      preferGenericWhenFallback
      articleLead={(ctx) => {
        const guidesEn = i18n.getFixedT("en", "guides") as TFunction<"guides">;
        const translator = ctx.translateGuides as TFunction<"guides">;
        const eventAny = translator(`content.${GUIDE_KEY}.event`, { returnObjects: true }) as unknown;
        const eventFallbackAny = guidesEn(`content.${GUIDE_KEY}.event`, { returnObjects: true }) as unknown;
        const event = normaliseLuminariaEvent(eventAny, eventFallbackAny);
        if (!event || (!event.date && !event.location && !(event.tips && event.tips.length > 0))) return null;
        return (
          <EventInfo
            {...(event.date ? { date: event.date } : {})}
            {...(event.location ? { location: event.location } : {})}
            {...(event.tips && event.tips.length > 0 ? { tips: event.tips } : {})}
          />
        );
      }}
      articleExtras={(ctx) => {
        const guidesEn = i18n.getFixedT("en", "guides") as TFunction<"guides">;
        const translator = ctx.translateGuides as TFunction<"guides">;
        const galleryAny = translator(`content.${GUIDE_KEY}.gallery`, { returnObjects: true }) as unknown;
        const galleryFallbackAny = guidesEn(`content.${GUIDE_KEY}.gallery`, { returnObjects: true }) as unknown;
        const galleryLocal = (galleryAny && typeof galleryAny === "object" ? (galleryAny as Record<string, unknown>) : {}) as Record<string, unknown>;
        const galleryFallback = (galleryFallbackAny && typeof galleryFallbackAny === "object" ? (galleryFallbackAny as Record<string, unknown>) : {}) as Record<string, unknown>;
        const terraceAlt =
          resolveLuminariaString(
            galleryLocal["terraceAlt"],
            `content.${GUIDE_KEY}.gallery.terraceAlt`,
            galleryFallback["terraceAlt"],
            ctx.article.title,
          ) ?? ctx.article.title;
        const coastAlt =
          resolveLuminariaString(
            galleryLocal["coastAlt"],
            `content.${GUIDE_KEY}.gallery.coastAlt`,
            galleryFallback["coastAlt"],
            ctx.article.title,
          ) ?? ctx.article.title;
        return (
          <ImageGallery
            items={[
              { src: "/img/hostel-terrace-bamboo-canopy.webp", alt: terraceAlt as string },
              { src: "/img/hostel-coastal-horizon.webp", alt: coastAlt as string },
            ]}
          />
        );
      }}
      additionalScripts={(ctx) => {
        const guidesEn = i18n.getFixedT("en", "guides") as TFunction<"guides">;
        const translator = ctx.translateGuides as TFunction<"guides">;
        const local = translator(`structured.${GUIDE_KEY}`, { returnObjects: true }) as unknown as Record<string, unknown> | undefined;
        const fallback = guidesEn(`structured.${GUIDE_KEY}`, { returnObjects: true }) as unknown as Record<string, unknown> | undefined;
        const eventAny = translator(`content.${GUIDE_KEY}.event`, { returnObjects: true }) as unknown;
        const eventFallbackAny = guidesEn(`content.${GUIDE_KEY}.event`, { returnObjects: true }) as unknown;
        const event = normaliseLuminariaEvent(eventAny, eventFallbackAny);
        const structured = deriveLuminariaStructuredData(local, fallback, ctx.article.title, ctx.article.description, event?.location);
        return (
          <EventStructuredData
            name={structured.name}
            startDate={structured.startDate}
            {...(structured.endDate ? { endDate: structured.endDate } : {})}
            locationName={structured.locationName}
            addressLocality={structured.addressLocality}
            description={structured.description}
          />
        );
      }}
    />
  );
}

export default memo(LuminariaPraiano);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "luminariaPraiano", {
    en: () => import("../../locales/en/guides/content/luminariaPraiano.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/luminariaPraiano.json`).catch(() => undefined),
  });
  return { lang } as const;
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({
    lang,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();


// head helpers implemented above using shared route head helpers
