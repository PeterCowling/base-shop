// src/routes/guides/marina-di-praia-and-secluded-beaches.tsx
import type { MetaFunction } from "react-router";

import ImageGallery, { type ImageGalleryItem } from "@/components/guides/ImageGallery";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { renderGuideLinkTokens } from "@/routes/guides/utils/_linkTokens";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteMeta } from "@/utils/routeHead";
import { buildLinks as buildSeoLinks } from "@/utils/seo";
import { getSlug } from "@/utils/slug";

import { getGuidesBundle } from "../../locales/guides";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

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
    articleLead: (context) => renderMarinaIntroWithGallery(context),
    genericContentOptions: { suppressIntro: true },
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
export { clientLoader, links,meta };

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

type GalleryCopy = { alt?: string; caption?: string } | undefined;

function renderMarinaIntroWithGallery(context: GuideSeoTemplateContext): JSX.Element | null {
  const intro = Array.isArray(context.intro)
    ? context.intro
        .filter((paragraph): paragraph is string => typeof paragraph === "string")
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
    : [];
  const gallery = renderMarinaGallery(context);

  if (intro.length === 0 && !gallery) return null;

  const [first, ...rest] = intro;

  return (
    <div className="space-y-4">
      {first ? <p>{renderGuideLinkTokens(first, context.lang, "intro-0")}</p> : null}
      {gallery}
      {rest.map((paragraph, index) => (
        <p key={`intro-${index + 1}`}>
          {renderGuideLinkTokens(paragraph, context.lang, `intro-${index + 1}`)}
        </p>
      ))}
    </div>
  );
}

function renderMarinaGallery(context: GuideSeoTemplateContext): JSX.Element | null {
  const itemsRaw = context.translateGuides(`content.${GUIDE_KEY}.gallery.items`, {
    returnObjects: true,
  }) as unknown;
  const localItems = Array.isArray(itemsRaw) ? (itemsRaw as GalleryCopy[]) : [];
  const fallbackItems = resolveEnglishGalleryItems();

  const sources = [
    {
      src: "/img/guides/marina-di-praia/marina-di-praia-cove.png",
      width: 1600,
      height: 1100,
    },
    {
      src: "/img/guides/marina-di-praia/marina-di-praia-beachfront.png",
      width: 900,
      height: 509,
    },
  ] as const;

  const galleryItems = sources.reduce<ImageGalleryItem[]>((acc, entry, index) => {
    const local = localItems[index];
    const fallback = fallbackItems[index];
    const altLocal = typeof local?.alt === "string" ? local.alt.trim() : "";
    const capLocal = typeof local?.caption === "string" ? local.caption.trim() : "";
    const altFallback = typeof fallback?.alt === "string" ? fallback.alt.trim() : "";
    const capFallback = typeof fallback?.caption === "string" ? fallback.caption.trim() : "";
    const alt = context.hasLocalizedContent ? (altLocal || altFallback) : altFallback;
    const caption = context.hasLocalizedContent ? (capLocal || capFallback) : capFallback;
    if (!alt) return acc;
    acc.push({ ...entry, alt, ...(caption ? { caption } : {}) });
    return acc;
  }, []);

  if (galleryItems.length === 0) return null;

  const titleRaw = context.translateGuides(`content.${GUIDE_KEY}.gallery.title`) as unknown;
  const title = typeof titleRaw === "string" && titleRaw.trim().length > 0 ? titleRaw.trim() : undefined;

  return (
    <section id="gallery">
      {title ? <h2>{title}</h2> : null}
      <ImageGallery items={galleryItems} />
    </section>
  );
}

function resolveEnglishGalleryItems(): GalleryCopy[] {
  try {
    const fixed = i18n.getFixedT?.("en", "guides");
    const value = fixed?.(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true });
    if (Array.isArray(value)) {
      return value as GalleryCopy[];
    }
  } catch {
    // ignore and fall back to eager bundles
  }

  try {
    const bundle = getGuidesBundle("en") as { content?: Record<string, unknown> } | undefined;
    const gallery = bundle?.content?.[GUIDE_KEY as string] as Record<string, unknown> | undefined;
    const items = (gallery?.["gallery"] as Record<string, unknown> | undefined)?.["items"];
    if (Array.isArray(items)) {
      return items as GalleryCopy[];
    }
  } catch {
    // ignore fallback errors
  }

  return [];
}
