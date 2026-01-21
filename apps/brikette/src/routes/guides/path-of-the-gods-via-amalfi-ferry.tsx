// src/routes/guides/path-of-the-gods-via-amalfi-ferry.tsx
import "@/routes/guides/_GuideSeoTemplate";

import { CfResponsiveImage } from "@/components/images/CfResponsiveImage";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideAbsoluteUrl, guideHref, type GuideKey } from "@/routes.guides-helpers";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";
import { OG_IMAGE } from "./path-of-the-gods.constants";
import { createPathOfTheGodsHowToSteps } from "./path-of-the-gods.how-to";
import { getPathOfTheGodsVariant } from "./path-of-the-gods.variants";

export const handle = { tags: ["hiking", "amalfi", "ferry", "positano"] } as const;

export const GUIDE_KEY = "pathOfTheGodsFerry" as const satisfies GuideKey;
export const GUIDE_SLUG = "path-of-the-gods-via-amalfi-ferry" as const;

type GuideImageCopy = { alt?: string; caption?: string };

const GUIDE_IMAGES = [
  { src: "/img/guides/path-of-the-gods-ferry/map-to-port.jpg", width: 1071, height: 564 },
  { src: "/img/guides/path-of-the-gods-ferry/point-1-turn-right.jpg", width: 1100, height: 538 },
  { src: "/img/guides/path-of-the-gods-ferry/tabacchi.jpg", width: 835, height: 470 },
  { src: "/img/guides/path-of-the-gods-ferry/point-2-stairs.jpg", width: 900, height: 538 },
  { src: "/img/guides/path-of-the-gods-ferry/point-3-stairs.jpg", width: 667, height: 538 },
  { src: "/img/guides/path-of-the-gods-ferry/point-4-stairs.jpg", width: 933, height: 498 },
  { src: "/img/guides/path-of-the-gods-ferry/point-5-port.jpg", width: 291, height: 463 },
  { src: "/img/guides/path-of-the-gods-ferry/port-ticket-booths.jpg", width: 588, height: 370 },
  { src: "/img/guides/path-of-the-gods-ferry/ferry-travelmar.jpg", width: 1134, height: 556 },
  { src: "/img/guides/path-of-the-gods-ferry/amalfi-port-walk.jpg", width: 628, height: 324 },
  { src: "/img/guides/path-of-the-gods-ferry/bomerano-jerla-sign.jpg", width: 1128, height: 519 },
  { src: "/img/guides/path-of-the-gods-ferry/bomerano-side-street.jpg", width: 662, height: 357 },
  { src: "/img/guides/path-of-the-gods-ferry/bomerano-piazza.jpg", width: 877, height: 634 },
  { src: "/img/guides/path-of-the-gods-ferry/trailhead-board.jpg", width: 854, height: 448 },
  { src: "/img/guides/path-of-the-gods-ferry/trail-path.jpg", width: 761, height: 379 },
  { src: "/img/guides/path-of-the-gods-ferry/nocelle-map.jpg", width: 773, height: 381 },
  { src: "/img/guides/path-of-the-gods-ferry/nocelle-stairs-sign.png", width: 1536, height: 1032 },
  { src: "/img/guides/path-of-the-gods-ferry/nocelle-stairs-up.jpg", width: 504, height: 486 },
  { src: "/img/guides/path-of-the-gods-ferry/nocelle-bus-stop.png", width: 1153, height: 541 },
] as const;

const SECTION_IMAGE_MAP = {
  "walk-to-port": [0, 1, 2, 3, 4, 5, 6],
  "buy-ferry-ticket": [7],
  "wait-for-ferry": [8],
  "walk-to-bus-stop": [9],
  "bus-to-bomerano": [10],
  "hike-trail": [11, 12, 13, 14],
  nocelle: [15, 16, 17, 18],
} as const;

const GUIDE_IMAGE_COPY_KEY = `content.${GUIDE_KEY}.images` as const;

const normalizeGuideImageCopy = (value: unknown): GuideImageCopy[] => {
  if (!Array.isArray(value)) return [];
  const readString = (entry: Record<string, unknown>, key: string): string | undefined => {
    const raw = entry[key];
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") return {};
    const record = entry as Record<string, unknown>;
    const alt = readString(record, "alt");
    const caption = readString(record, "caption");
    return {
      ...(alt ? { alt } : {}),
      ...(caption ? { caption } : {}),
    };
  });
};

const useGuideImageCopy = (): GuideImageCopy[] => {
  const lang = useCurrentLanguage();
  const safeLang = (lang ?? i18nConfig.fallbackLng) as AppLanguage;
  const { translateGuides, guidesEn } = useGuideTranslations(safeLang);
  const local = normalizeGuideImageCopy(
    translateGuides(GUIDE_IMAGE_COPY_KEY, { returnObjects: true }),
  );
  const fallback = normalizeGuideImageCopy(
    guidesEn(GUIDE_IMAGE_COPY_KEY, { returnObjects: true }),
  );
  return GUIDE_IMAGES.map((_, index) => {
    const localEntry = local[index];
    const fallbackEntry = fallback[index];
    const captionValue = localEntry?.caption ?? fallbackEntry?.caption;
    const altValue = localEntry?.alt ?? fallbackEntry?.alt ?? "";
    return {
      alt: altValue,
      ...(typeof captionValue === "string" && captionValue.length > 0 ? { caption: captionValue } : {}),
    };
  });
};

// i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only class string for gallery figures
const FIGURE_CLASS =
  /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only class string for gallery figures */ "rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60";

function GuideImageGrid({ indexes }: { indexes: readonly number[] }): JSX.Element | null {
  const copy = useGuideImageCopy();
  const items = indexes
    .map((index) => {
      const image = GUIDE_IMAGES[index];
      if (!image) return null;
      const text = copy[index];
      return {
        ...image,
        alt: text?.alt ?? "",
        ...(text?.caption ? { caption: text.caption } : {}),
      };
    })
    .filter((item): item is (typeof GUIDE_IMAGES)[number] & { alt: string; caption?: string } => item !== null);

  if (items.length === 0) return null;

  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Responsive column utilities
  const columns =
    items.length >= 3
      ? /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Responsive column utilities */ "sm:grid-cols-2 lg:grid-cols-3"
      : items.length === 2
      ? /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Responsive column utilities */ "sm:grid-cols-2"
      : /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Responsive column utilities */ "sm:grid-cols-1";

  return (
    <div className={`grid gap-4 ${columns}`}>
      {items.map((item) => (
        <figure key={item.src} className={FIGURE_CLASS}>
          <CfResponsiveImage
            src={item.src}
            width={item.width}
            height={item.height}
            preset="gallery"
            alt={item.alt}
            loading="lazy"
            className="block h-auto w-full rounded-lg"
            data-aspect={`${item.width}/${item.height}`}
          />
          {item.caption ? (
            <figcaption className="mt-2 text-center text-sm text-brand-text/80">
              {item.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for pathOfTheGodsFerry"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard
}

const {
  Component,
  clientLoader,
  meta: routeMeta,
  links: routeLinks,
} = defineGuideRoute(manifestEntry, {
  template: () => {
    const { totalTime } = getPathOfTheGodsVariant("ferry");
    return {
      ogImage: OG_IMAGE,
      includeHowToStructuredData: true,
      relatedGuides: {
        items: [
          { key: "pathOfTheGods" },
          { key: "pathOfTheGodsBus" },
          { key: "pathOfTheGodsNocelle" },
        ],
      },
      genericContentOptions: {
        sectionBottomExtras: {
          "walk-to-port": <GuideImageGrid indexes={SECTION_IMAGE_MAP["walk-to-port"]} />,
          "buy-ferry-ticket": <GuideImageGrid indexes={SECTION_IMAGE_MAP["buy-ferry-ticket"]} />,
          "wait-for-ferry": <GuideImageGrid indexes={SECTION_IMAGE_MAP["wait-for-ferry"]} />,
          "walk-to-bus-stop": <GuideImageGrid indexes={SECTION_IMAGE_MAP["walk-to-bus-stop"]} />,
          "bus-to-bomerano": <GuideImageGrid indexes={SECTION_IMAGE_MAP["bus-to-bomerano"]} />,
          "hike-trail": <GuideImageGrid indexes={SECTION_IMAGE_MAP["hike-trail"]} />,
          nocelle: <GuideImageGrid indexes={SECTION_IMAGE_MAP.nocelle} />,
        },
      },
      buildHowToSteps: (context) =>
        createPathOfTheGodsHowToSteps(context, {
          guideKey: GUIDE_KEY,
          totalTime,
        }),
    };
  },
  meta: ({ data }, entry) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = guideHref(lang, entry.key);
    const url = guideAbsoluteUrl(lang, entry.key);
    const imageSrc = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${entry.metaKey ?? entry.key}.title`,
      description: `guides.meta.${entry.metaKey ?? entry.key}.description`,
      url,
      path,
      image: { src: imageSrc, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: entry.status === "live",
    });
  },
  links: (_args, _entry, base) => {
    const shared = buildRouteLinks();
    return shared.length > 0 ? shared : base;
  },
});

export default Component;
export { clientLoader };
export const meta = routeMeta;
export const links = routeLinks;
