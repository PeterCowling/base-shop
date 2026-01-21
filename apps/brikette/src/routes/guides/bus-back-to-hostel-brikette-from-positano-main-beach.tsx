// src/routes/guides/bus-back-to-hostel-brikette-from-positano-main-beach.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { CfImage } from "@/components/images/CfImage";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import EN_POSITANO_RETURN_GUIDE from "@/locales/en/guides/content/positanoMainBeachBusBack.json";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["beaches", "bus", "stairs", "positano"] };

export const GUIDE_KEY = "positanoMainBeachBusBack" as const satisfies GuideKey;
export const GUIDE_SLUG = "bus-back-to-hostel-brikette-from-positano-main-beach" as const;

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

const BUS_INTERIOR_IMG_SRC = "/img/guides/positano-main-beach-bus-back/interno-positano-bus.jpg" as const;
const BAR_INTERNAZIONALE_STOP_IMG_SRC = "/img/guides/positano-main-beach-bus-back/bar-internazionale-stop.jpg" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoMainBeachBusBack"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleExtras: buildPositanoReturnExtras,
    relatedGuides: {
      items: [
        { key: "positanoMainBeachBusDown" },
        { key: "positanoMainBeachWalkBack" },
        { key: "positanoBeaches" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "positano", "bus"],
      excludeGuide: ["positanoMainBeachBusDown", "positanoMainBeachWalkBack", "positanoBeaches"],
      includeRooms: true,
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();

function buildPositanoReturnExtras(context: GuideSeoTemplateContext) {
  const photosTitle = translateWithFallback(context, `content.${GUIDE_KEY}.extras.photos.title`,
    readJsonFallback("extras.photos.title"));

  const busInterior = buildPhotoContent(context, "busInterior", {
    alt: readJsonFallback("extras.photos.items.busInterior.alt") ?? "",
    caption: readJsonFallback("extras.photos.items.busInterior.caption") ?? "",
  });

  const barStop = buildPhotoContent(context, "barInternazionaleStop", {
    alt: readJsonFallback("extras.photos.items.barInternazionaleStop.alt") ?? "",
    caption: readJsonFallback("extras.photos.items.barInternazionaleStop.caption") ?? "",
  });

  if (!busInterior && !barStop) return null;

  return (
    <section className="space-y-4">
      {photosTitle ? <h2>{photosTitle}</h2> : null}
      {busInterior ? renderFigure(BUS_INTERIOR_IMG_SRC, 1596, 804, busInterior.alt, busInterior.caption) : null}
      {barStop ? renderFigure(BAR_INTERNAZIONALE_STOP_IMG_SRC, 550, 310, barStop.alt, barStop.caption) : null}
    </section>
  );
}

function renderFigure(src: string, width: number, height: number, alt: string, caption: string) {
  return (
    <figure className="space-y-2">
      <CfImage
        src={src}
        preset="gallery"
        width={width}
        height={height}
        alt={alt}
        loading="lazy"
        className="h-auto w-full rounded-lg"
      />
      {caption ? <figcaption className="text-sm text-brand-text/80 dark:text-brand-text/70">{caption}</figcaption> : null}
    </figure>
  );
}

function buildPhotoContent(
  context: GuideSeoTemplateContext,
  key: "busInterior" | "barInternazionaleStop",
  fallback: { alt: string; caption: string },
) {
  const alt = translateWithFallback(
    context,
    `content.${GUIDE_KEY}.extras.photos.items.${key}.alt`,
    fallback.alt,
  );
  const caption = translateWithFallback(
    context,
    `content.${GUIDE_KEY}.extras.photos.items.${key}.caption`,
    fallback.caption,
  );

  if (!alt && !caption) return null;
  return { alt: alt || fallback.alt, caption: caption || fallback.caption };
}

function translateWithFallback(
  context: GuideSeoTemplateContext,
  key: string,
  fallbackValue = "",
): string {
  const local = normaliseTranslatedString(key, context.translateGuides(key));
  if (local) return local;

  const english = normaliseTranslatedString(key, getEnglishTranslator(context)?.(key));
  if (english) return english;

  return fallbackValue;
}

function readJsonFallback(path: string): string | undefined {
  const segments = path.split(".");
  let cursor: unknown = EN_POSITANO_RETURN_GUIDE;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor.trim() : undefined;
}

function getEnglishTranslator(context: GuideSeoTemplateContext) {
  if (typeof context.translateGuidesEn === "function") {
    return context.translateGuidesEn;
  }
  try {
    const fixed = i18n.getFixedT("en", "guides");
    if (typeof fixed === "function") {
      return (key: string, options?: Record<string, unknown>) => fixed(key, options);
    }
  } catch {
    /* noop */
  }
  try {
    const fallback = (i18n as unknown as { __tGuidesFallback?: (key: string, options?: Record<string, unknown>) => unknown })
      .__tGuidesFallback;
    if (typeof fallback === "function") {
      return fallback;
    }
  } catch {
    /* noop */
  }
  return undefined;
}

function normaliseTranslatedString(key: string, value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  if (trimmed === key) return "";
  if (trimmed.startsWith(`${key}:`)) return "";
  return trimmed;
}

function buildMeta(metaKey: string, areaSlugKey: GuideAreaSlugKey, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
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
