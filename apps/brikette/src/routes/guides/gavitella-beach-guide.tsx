import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";

import { guideHref, guideAbsoluteUrl, type GuideKey } from "@/routes.guides-helpers";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { BASE_URL } from "@/config/site";
import { CfImage } from "@/components/images/CfImage";
import i18n from "@/i18n";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";

import type { LinksFunction } from "react-router";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";

export const handle = { tags: ["beaches", "praiano", "tips"] };

export const GUIDE_KEY = "gavitellaBeachGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "gavitella-beach-guide" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for gavitellaBeachGuide"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const HERO_IMAGE = {
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

const SECTION_IMAGE_VARIANTS = {
  overview: "overview",
  "gavitella-club": "gavitellaClub",
  "one-fire": "oneFire",
} as const;

type SectionImageVariant = (typeof SECTION_IMAGE_VARIANTS)[keyof typeof SECTION_IMAGE_VARIANTS];

const GAVITELLA_SECTION_IMAGES: Record<
  SectionImageVariant,
  { src: string; width: number; height: number }
> = {
  overview: {
    src: "/img/guides/gavitella/gavitella-1.jpg",
    width: 1080,
    height: 608,
  },
  gavitellaClub: {
    src: "/img/guides/gavitella/gavitella-2.jpg",
    width: 600,
    height: 399,
  },
  oneFire: {
    src: "/img/guides/gavitella/gavitella-3.jpg",
    width: 1920,
    height: 1080,
  },
};

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): ReturnType<typeof toAppLanguage> => {
  const dataLangCandidate = args?.data as { lang?: string } | null | undefined;
  const paramsLangCandidate = args?.params as { lang?: unknown } | null | undefined;
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

const { Component, clientLoader, meta: routeMeta, links: routeLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: HERO_IMAGE,
    relatedGuides: {
      items: [
        { key: "positanoBeaches" },
        { key: "marinaDiPraiaBeaches" },
        { key: "boatTours" },
      ],
    },
    genericContentOptions: {
      sectionTopExtras: {
        overview: <GavitellaSectionFigure variant={SECTION_IMAGE_VARIANTS.overview} />,
        "gavitella-club": <GavitellaSectionFigure variant={SECTION_IMAGE_VARIANTS["gavitella-club"]} />,
        "one-fire": <GavitellaSectionFigure variant={SECTION_IMAGE_VARIANTS["one-fire"]} />,
      },
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(HERO_IMAGE.path, HERO_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: HERO_IMAGE.width, height: HERO_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args) => {
    const lang = resolveLangFromLinksArgs(args);
    const path = guideHref(lang, manifestEntry.key);
    const request = args?.request instanceof Request ? args.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  },
});

export default Component;
export { clientLoader };
export const meta = routeMeta;
export const links = ((...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, manifestEntry.key);
    const request = firstArg?.request instanceof Request ? firstArg.request : undefined;
    const origin = resolveOrigin(request);
    return buildRouteLinks({
      lang,
      path,
      origin,
    });
  });
}) satisfies LinksFunction;

type SectionFigureProps = {
  variant: SectionImageVariant;
};

function GavitellaSectionFigure({ variant }: SectionFigureProps): JSX.Element {
  const currentLang = useCurrentLanguage();
  const lang = (currentLang ?? i18nConfig.fallbackLng) as AppLanguage;
  const image = GAVITELLA_SECTION_IMAGES[variant];
  const alt = translateWithFallback(
    i18n.getFixedT(lang, "guides"),
    `content.${GUIDE_KEY}.images.${variant}.alt`,
  );
  const caption = translateWithFallback(
    i18n.getFixedT(lang, "guides"),
    `content.${GUIDE_KEY}.images.${variant}.caption`,
  );

  return (
    <figure className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60">
      <CfImage
        src={image.src}
        width={image.width}
        height={image.height}
        preset="gallery"
        alt={alt}
        className="h-auto w-full rounded-lg"
      />
      {caption ? <figcaption className="mt-2 text-center text-sm text-brand-text/80">{caption}</figcaption> : null}
    </figure>
  );
}

function translateWithFallback(
  translate: ((key: string, options?: Record<string, unknown>) => unknown) | undefined,
  key: string,
): string {
  if (typeof translate !== "function") return "";
  const primary = translate(key);
  if (typeof primary === "string") {
    const trimmed = primary.trim();
    if (trimmed.length > 0 && trimmed !== key) return trimmed;
  }
  try {
    const fallback = i18n.getFixedT("en", "guides")?.(key);
    if (typeof fallback === "string") {
      const trimmed = fallback.trim();
      if (trimmed.length > 0 && trimmed !== key) return trimmed;
    }
  } catch {
    // ignore fallback errors
  }
  return "";
}
