// src/routes/guides/naples-to-positano.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import ImageGallery, { type ImageGalleryItem } from "@/components/guides/ImageGallery";
import { ensureArray } from "@/utils/i18nContent";
import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import type { LinksFunction } from "react-router";

export const handle = { tags: ["transport", "naples", "positano", "ferry", "bus", "car"] };

export const GUIDE_KEY = "naplesPositano" as const satisfies GuideKey;
export const GUIDE_SLUG = "naples-to-positano" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

function normaliseText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(`guide manifest entry missing for ${GUIDE_KEY}`); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): ReturnType<typeof toAppLanguage> => {
  const dataLangCandidate = args?.data as { lang?: string } | null | undefined;
  const paramsLangCandidate = args?.params as { lang?: unknown } | undefined;
  const dataLang = typeof dataLangCandidate?.lang === "string" ? dataLangCandidate.lang : undefined;
  const paramLang = typeof paramsLangCandidate?.lang === "string" ? paramsLangCandidate.lang : undefined;
  return toAppLanguage(dataLang ?? paramLang ?? undefined);
};

const resolveOrigin = (request: Request | undefined): string => {
  if (!request) return BASE_URL;
  try {
    return new URL(request.url).origin;
  } catch {
    return BASE_URL;
  }
};

const { Component, clientLoader: routeClientLoader, meta: routeMeta, links: routeLinks } =
  defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleExtras: (context) => {
      const translate = context.translateGuides;
      const galleryRaw = translate(`content.${GUIDE_KEY}.gallery`, { returnObjects: true }) as unknown;
      const galleryObject =
        galleryRaw && typeof galleryRaw === "object" && !Array.isArray(galleryRaw)
          ? (galleryRaw as Record<string, unknown>)
          : null;

      const galleryTitle: string =
        normaliseText(galleryObject?.["title"]) ??
        normaliseText(translate(`content.${GUIDE_KEY}.toc.gallery`)) ??
        normaliseText(translate("labels.photoGallery")) ??
        context.article.title;

      const itemsRaw =
        galleryObject?.["items"] ?? translate(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true });
      const galleryItems = ensureArray<Record<string, unknown>>(itemsRaw).reduce<ImageGalleryItem[]>(
        (acc, item) => {
          const src = normaliseText(item["src"]);
          if (!src) return acc;

          const caption = normaliseText(item["caption"]);
          const widthValue = item["width"];
          const heightValue = item["height"];
          const width = typeof widthValue === "number" ? widthValue : 1200;
          const height = typeof heightValue === "number" ? heightValue : 800;

          acc.push({
            src,
            alt: galleryTitle,
            ...(caption ? { caption } : {}),
            width,
            height,
          });
          return acc;
        },
        [],
      );

      if (galleryItems.length === 0) return null;

      return (
        <section id="gallery">
          <h2>{galleryTitle}</h2>
          <ImageGallery items={galleryItems} />
        </section>
      );
    },
  }),
  meta: ({ data }, entry) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, entry.key);
    const url = guideAbsoluteUrl(lang, entry.key);
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (args, entry) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, entry.key);
    const request =
      args && typeof args === "object" && "request" in args
        ? (args as { request?: Request }).request
        : undefined;
    const origin = resolveOrigin(request instanceof Request ? request : undefined);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  },
});

export default Component;
export const clientLoader = routeClientLoader;
export const meta = routeMeta;
export const links: LinksFunction = routeLinks;
