// src/routes/guides/getting-to-laurito-beach-by-bus.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";

import { CfImage } from "@/components/images/CfImage";
import { CfResponsiveImage } from "@/components/images/CfResponsiveImage";
import { Grid } from "@acme/ui/atoms/Grid";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { GuideSeoTemplateContext, Translator } from "./guide-seo/types";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { MetaFunction } from "react-router";

export const handle = { tags: ["beaches", "bus", "stairs", "positano"] };

export const GUIDE_KEY = "lauritoBeachBusDown" as const satisfies GuideKey;
export const GUIDE_SLUG = "getting-to-laurito-beach-by-bus" as const;

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

const FIGURE_SOURCES = [
  { src: "/img/guides/laurito-bus/image2.jpg", width: 1024, height: 516 },
  { src: "/img/guides/laurito-bus/image3.jpg", width: 1024, height: 577 },
] as const;

const QR_IMAGE_SRC = "/img/guides/laurito-bus/image1.png" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for lauritoBeachBusDown");

type LeadFigureCopy = { alt: string; caption: string } | undefined;

type LauritoBusLeadExtras = {
  hasStructured: boolean;
  shareLabel: string;
  qrAlt: string;
  figures: LeadFigureCopy[];
};

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "lauritoBeachBusDown", {
    en: () => import("../../locales/en/guides/content/lauritoBeachBusDown.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/lauritoBeachBusDown.json`).catch(() => undefined),
  });
  return { lang } as const;
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => collectLauritoBusLeadExtras(context),
  render: (context, extras) => {
    if (!extras.hasStructured) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CfImage
            src={QR_IMAGE_SRC}
            width={180}
            height={180}
            alt={extras.qrAlt}
            loading="lazy"
            preset="thumb"
            className="h-auto w-28 rounded-md border border-brand-outline/20 dark:border-brand-outline/40"
          />
          {extras.shareLabel ? <p className="text-sm text-brand-text/80">{extras.shareLabel}</p> : null}
        </div>
        <Grid columns={{ base: 1, sm: 2 }} gap={4}>
          {FIGURE_SOURCES.map(({ src, width, height }, index) => {
            const copy = extras.figures[index];
            if (!copy) return null;
            return (
              <figure
                key={src}
                className="rounded-xl border border-brand-outline/20 bg-brand-surface/40 p-2 shadow-sm dark:border-brand-outline/40 dark:bg-brand-bg/60"
              >
                <CfResponsiveImage
                  src={src}
                  width={width}
                  height={height}
                  preset="gallery"
                  alt={copy.alt}
                  loading="lazy"
                  className="block h-auto w-full rounded-lg"
                  data-aspect={`${width}/${height}`}
                />
                {copy.caption ? (
                  <figcaption className="mt-2 text-center text-sm text-brand-text/80">
                    {copy.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </Grid>
      </div>
    );
  },
  isStructured: (extras) => extras.hasStructured,
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    relatedGuides: {
      items: [
        { key: "lauritoBeachBusBack" },
        { key: "positanoBeaches" },
        { key: "positanoMainBeachBusDown" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "positano", "bus"],
      excludeGuide: ["lauritoBeachBusBack", "positanoBeaches", "positanoMainBeachBusDown"],
      includeRooms: true,
    },
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

export default Component;
export { clientLoader, meta, links };

function collectLauritoBusLeadExtras(context: GuideSeoTemplateContext): LauritoBusLeadExtras {
  const shareLabel = translateWithFallback(context, `content.${GUIDE_KEY}.lead.shareLabel`);
  const qrAlt = translateWithFallback(context, `content.${GUIDE_KEY}.lead.qrAlt`);
  const figures = buildFigureCopy(context);
  const hasFigureContent = figures.some((figure) => figure && (figure.alt || figure.caption));
  return {
    hasStructured: Boolean(shareLabel || qrAlt || hasFigureContent),
    shareLabel,
    qrAlt,
    figures,
  };
}

function buildFigureCopy(context: GuideSeoTemplateContext): LeadFigureCopy[] {
  const key = `content.${GUIDE_KEY}.lead.figures`;
  const local = context.translateGuides(key, { returnObjects: true }) as unknown;
  const fallback = getEnglishTranslator()?.(key, { returnObjects: true }) as unknown;

  const normalise = (value: unknown): LeadFigureCopy[] => {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => {
      if (!entry || typeof entry !== "object") return undefined;
      const record = entry as Record<string, unknown>;
      const alt = readMeaningfulString(record.alt);
      const caption = readMeaningfulString(record.caption);
      if (!alt && !caption) return undefined;
      return { alt: alt ?? "", caption: caption ?? "" };
    });
  };

  const localFigures = normalise(local);
  const fallbackFigures = normalise(fallback);

  return FIGURE_SOURCES.map((_, index) => {
    const localEntry = localFigures[index];
    const fallbackEntry = fallbackFigures[index];
    if (localEntry && (localEntry.alt || localEntry.caption)) {
      return {
        alt: localEntry.alt || fallbackEntry?.alt || "",
        caption: localEntry.caption || fallbackEntry?.caption || "",
      };
    }
    if (fallbackEntry && (fallbackEntry.alt || fallbackEntry.caption)) {
      return { alt: fallbackEntry.alt || "", caption: fallbackEntry.caption || "" };
    }
    return undefined;
  });
}

function translateWithFallback(
  context: GuideSeoTemplateContext,
  key: string,
): string {
  const primary = context.translateGuides(key);
  if (typeof primary === "string") {
    const trimmed = primary.trim();
    if (trimmed.length > 0 && trimmed !== key) return trimmed;
  }
  const fallbackT = getEnglishTranslator();
  if (fallbackT) {
    const fallback = fallbackT(key);
    if (typeof fallback === "string") {
      const trimmed = fallback.trim();
      if (trimmed.length > 0 && trimmed !== key) return trimmed;
    }
  }
  return "";
}

function getEnglishTranslator() {
  try {
    return i18n.getFixedT("en", "guides");
  } catch {
    return undefined;
  }
}

function readMeaningfulString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
