// src/routes/guides/bus-back-from-laurito-beach.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";
import { useGuideTranslations } from "./guide-seo/translations";

import RelatedGuides from "@/components/guides/RelatedGuides";
import { CfImage } from "@/components/images/CfImage";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { BASE_URL } from "@/config/site";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["beaches", "bus", "positano"] };

export const GUIDE_KEY = "lauritoBeachBusBack" as const satisfies GuideKey;
export const GUIDE_SLUG = "bus-back-from-laurito-beach" as const;

type ArticleLeadCopy = {
  scanHeading?: string;
  qrAlt?: string;
  rideAlt?: string;
  rideCaption?: string;
  stopAlt?: string;
  stopCaption?: string;
};

const ARTICLE_LEAD_IMAGES = {
  qr: "/img/guides/laurito/laurito-bus-qr.jpg",
  ride: "/img/guides/laurito/laurito-bus-ride.jpg",
  stop: "/img/guides/laurito/laurito-chiesa-nuova-stop.jpg",
} as const;

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

function normalizeArticleLeadCopy(value: unknown): ArticleLeadCopy {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const extract = (key: string): string | undefined => {
    const raw = record[key];
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };
  return {
    scanHeading: extract("scanHeading"),
    qrAlt: extract("qrAlt"),
    rideAlt: extract("rideAlt"),
    rideCaption: extract("rideCaption"),
    stopAlt: extract("stopAlt"),
    stopCaption: extract("stopCaption"),
  };
}

function useArticleLeadCopy(): { lang: AppLanguage; copy: ArticleLeadCopy } {
  const lang = useCurrentLanguage();
  const safeLang = (lang ?? i18nConfig.fallbackLng) as AppLanguage;
  const { translateGuides } = useGuideTranslations(safeLang);
  const raw = translateGuides(`content.${GUIDE_KEY}.articleLead`, { returnObjects: true });
  const copy = normalizeArticleLeadCopy(raw);
  return { lang: safeLang, copy };
}

function LauritoArticleLead(): JSX.Element {
  const { lang, copy } = useArticleLeadCopy();
  const {
    scanHeading = "",
    qrAlt = "",
  } = copy;

  return (
    <>
      <div className="flex items-center gap-3">
        <CfImage
          src={ARTICLE_LEAD_IMAGES.qr}
          width={180}
          height={180}
          preset="thumb"
          alt={qrAlt ?? ""}
          className="h-auto rounded-md border border-brand-outline/20 dark:border-brand-outline/40"
        />
        {scanHeading ? <p className="text-sm text-brand-text/80">{scanHeading}</p> : null}
      </div>
      <RelatedGuides
        lang={lang}
        items={[
          { key: "lauritoBeachGuide" },
          { key: "beaches" },
        ]}
        listLayout="twoColumn"
      />
    </>
  );
}

type SectionFigureVariant = "ride" | "stop";

function LauritoSectionFigure({ variant }: { variant: SectionFigureVariant }): JSX.Element {
  const { copy } = useArticleLeadCopy();
  const isRide = variant === "ride";
  const image = isRide ? ARTICLE_LEAD_IMAGES.ride : ARTICLE_LEAD_IMAGES.stop;
  const alt = (isRide ? copy.rideAlt : copy.stopAlt) ?? "";
  const caption = (isRide ? copy.rideCaption : copy.stopCaption) ?? "";

  return (
    <figure className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60">
      <CfImage
        src={image}
        width={1024}
        height={516}
        preset="gallery"
        alt={alt}
        className="h-auto w-full rounded-lg"
      />
      {caption ? <figcaption className="mt-2 text-center text-sm text-brand-text/80">{caption}</figcaption> : null}
    </figure>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for lauritoBeachBusBack");
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: () => ({ hasStructured: true }),
  render: () => <LauritoArticleLead />,
  // Keep GenericContent ToC behaviour; no custom ToC items required so omit selectTocItems.
});

const resolveLang = (payload?: { lang?: AppLanguage }): AppLanguage => {
  return payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
};

const buildPath = (lang: AppLanguage): string => {
  const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
  return `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
};

const meta: MetaFunction = ({ data }) => {
  const payload = (data ?? {}) as { lang?: AppLanguage };
  const lang = resolveLang(payload);
  const path = buildPath(lang);
  const image = buildCfImageUrl(OG_IMAGE.path, {
    width: OG_DIMENSIONS.width,
    height: OG_DIMENSIONS.height,
    quality: 85,
    format: "auto",
  });
  const title = `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`;
  const description = `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
    ogType: "article",
    includeTwitterUrl: true,
    isPublished: manifestEntry.status === "live",
  });
};

const links: LinksFunction = (args) => {
  const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
  const lang = resolveLang(payload);
  const path = buildPath(lang);
  return buildRouteLinks({ lang, path, origin: BASE_URL });
};

const { Component, clientLoader } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    genericContentOptions: {
      sectionTopExtras: {
        "ride-the-bus": <LauritoSectionFigure variant="ride" />,
      },
      sectionBottomExtras: {
        "get-off-bus": <LauritoSectionFigure variant="stop" />,
      },
    },
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: (args) => meta(args),
  links: (args) => links(args),
});

export default Component;
export { clientLoader, meta, links };