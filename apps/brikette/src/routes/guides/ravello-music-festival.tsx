// src/routes/guides/ravello-music-festival.tsx
import { memo, useMemo } from "react";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { LoaderFunctionArgs } from "react-router-dom";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import EventStructuredData from "@/components/seo/EventStructuredData";
import EventInfo from "@/components/guides/EventInfo";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { AppLanguage } from "@/i18n.config";
import { useGuideTranslations } from "./guide-seo/translations";

export const handle = { tags: ["event", "culture", "ravello"] };

export const GUIDE_KEY = "ravelloFestival" as const satisfies GuideKey;
export const GUIDE_SLUG = "ravello-music-festival-guide" as const;

type EventSchemaTranslation = {
  name?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  locationName?: unknown;
  addressLocality?: unknown;
  description?: unknown;
};

const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);
const strings = (v: unknown) =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.trim())
    : [];

function resolveSchemaValue(source: EventSchemaTranslation | undefined, fallback: EventSchemaTranslation | undefined, key: keyof EventSchemaTranslation): string | undefined {
  return str(source?.[key]) ?? str(fallback?.[key]);
}

function RavelloMusicFestival(): JSX.Element {
  const lang = useCurrentLanguage();
  // Prefer hook-provided guides translator so tests that stub useTranslation
  // can supply localized structured content (eventInfo, sections, etc.).
  const { tGuides } = useGuideTranslations(lang as AppLanguage);
  const eventInfo = useMemo(() => {
    try {
      const infoRaw = tGuides(`content.${GUIDE_KEY}.eventInfo`, { returnObjects: true }) as unknown;
      const info = (typeof infoRaw === "object" && infoRaw !== null ? (infoRaw as Record<string, unknown>) : {}) as Record<string, unknown>;
      const afterSectionId = str(info["afterSectionId"]);
      const date = str(info["date"]);
      const location = str(info["location"]);
      const tips = strings(info["tips"]);
      return { afterSectionId, date, location, tips } as const;
    } catch {
      return { afterSectionId: undefined, date: undefined, location: undefined, tips: [] as string[] } as const;
    }
  }, [tGuides]);
  const sectionExtras = useMemo(() => {
    const { afterSectionId, date, location, tips } = eventInfo;
    if (!afterSectionId || (!date && !location && tips.length === 0)) {
      return undefined as Record<string, JSX.Element> | undefined;
    }
    const eventProps = {
      tips,
      ...(typeof date === "string" && date.length > 0 ? { date } : {}),
      ...(typeof location === "string" && location.length > 0 ? { location } : {}),
    };
    return { [afterSectionId]: <EventInfo {...eventProps} /> } as Record<string, JSX.Element>;
  }, [eventInfo]);
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      // Provide a custom ToC builder so anchors are normalised to
      // section-ordinal ids when translations omit or mismatch ids.
      showTocWhenUnlocalized={false}
      preferManualWhenUnlocalized
      suppressUnlocalizedFallback
      buildTocItems={(ctx) => {
        const sections = Array.isArray(ctx.sections) ? ctx.sections : [];
        const base = Array.isArray(ctx.toc) ? ctx.toc : [];
        const items = base
          .map((it, idx) => {
            const rawLabel = typeof it?.["label"] === "string" ? it["label"].trim() : "";
            if (!rawLabel) return null;
            const rawHref = typeof it?.["href"] === "string" ? it["href"].trim() : "";
            const prefixed = rawHref ? (rawHref.startsWith("#") ? rawHref : `#${rawHref}`) : "";
            // Keep special anchors as-is
            if (prefixed === "#faqs" || prefixed === "#tips") {
              return { href: prefixed, label: rawLabel };
            }
            // When href is a numbered section, normalise to 1-based index
            if (/^#section-\d+$/i.test(prefixed)) {
              return { href: `#section-${idx + 1}`, label: rawLabel };
            }
            if (prefixed) {
              // Only keep explicit anchors that match a real section id;
              // otherwise fall back to the ordinal anchor for this index.
              const ref = prefixed.replace(/^#/, "");
              const hasMatch = sections.some((s) => typeof s?.id === "string" && s.id.trim() === ref);
              if (hasMatch) {
                // For explicit numeric ids, still normalise to 1-based display
                if (/^section-\d+$/i.test(ref)) {
                  return { href: `#section-${idx + 1}`, label: rawLabel };
                }
                return { href: `#${ref}`, label: rawLabel };
              }
            }
            // Derive from section order when href is blank or mismatched
            return { href: `#section-${idx + 1}`, label: rawLabel };
          })
          .filter((x): x is { href: string; label: string } => x != null);

        if (items.length > 0) return items;

        // Fallback: build from sections when no base ToC exists
        return sections
          .filter((s) => typeof s?.title === "string" && s.title.trim().length > 0 && Array.isArray(s.body) && s.body.length > 0)
          .map((s, idx) => {
            const idBase = typeof s.id === "string" && s.id.trim().length > 0 ? s.id.trim() : `section-${idx + 1}`;
            const idNorm = /^section-\d+$/i.test(idBase) ? `section-${idx + 1}` : idBase;
            return { href: `#${idNorm}`, label: s.title.trim() };
          });
      }}
      {...(sectionExtras ? { genericContentOptions: { sectionBottomExtras: sectionExtras } } : {})}
      articleExtras={(ctx) => {
        const { afterSectionId, date, location, tips } = eventInfo;
        const injected = Boolean(
          afterSectionId &&
            sectionExtras &&
            (ctx.sections || []).some((s) => s.id === afterSectionId)
        );
        if (!injected && (date || location || tips.length > 0)) {
          const eventProps = {
            tips,
            ...(typeof date === "string" && date.length > 0 ? { date } : {}),
            ...(typeof location === "string" && location.length > 0 ? { location } : {}),
          };
          return <EventInfo {...eventProps} />;
        }
        return null;
      }}
      additionalScripts={(ctx) => {
        const t = ctx.translateGuides as (k: string, o?: Record<string, unknown>) => unknown;
        const en = i18n.getFixedT("en", "guides") as typeof t;
        const schemaRaw = t(`content.${GUIDE_KEY}.eventSchema`, { returnObjects: true }) as unknown;
        const schemaFallbackRaw = en(`content.${GUIDE_KEY}.eventSchema`, { returnObjects: true }) as unknown;
        const source = (typeof schemaRaw === "object" && schemaRaw !== null ? (schemaRaw as EventSchemaTranslation) : undefined);
        const fallback = (typeof schemaFallbackRaw === "object" && schemaFallbackRaw !== null ? (schemaFallbackRaw as EventSchemaTranslation) : undefined);
        const payload = {
          name: resolveSchemaValue(source, fallback, "name") ?? "",
          startDate: resolveSchemaValue(source, fallback, "startDate") ?? "",
          endDate: resolveSchemaValue(source, fallback, "endDate"),
          locationName: resolveSchemaValue(source, fallback, "locationName") ?? "",
          addressLocality: resolveSchemaValue(source, fallback, "addressLocality") ?? "",
          description: resolveSchemaValue(source, fallback, "description"),
        };
        const eventProps = {
          name: payload.name,
          startDate: payload.startDate,
          locationName: payload.locationName,
          addressLocality: payload.addressLocality,
          ...(payload.endDate ? { endDate: payload.endDate } : {}),
          ...(payload.description ? { description: payload.description } : {}),
        };
        return (
          <EventStructuredData {...eventProps} />
        );
      }}
    />
  );
}

export default memo(RavelloMusicFestival);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "ravelloFestival", {
    en: () => import("../../locales/en/guides/content/ravelloFestival.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/ravelloFestival.json`).catch(() => undefined),
  });
  return { lang } as const;
}


export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: string };
  const lang = (d.lang as string) || "en";
  const path = `/${lang}/${getSlug("experiences", lang as AppLanguage)}/${guideSlug(lang as AppLanguage, GUIDE_KEY as GuideKey)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  const title = `guides.meta.${GUIDE_KEY}.title`;
  const description = `guides.meta.${GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang: lang as AppLanguage,
    title,
    description,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
