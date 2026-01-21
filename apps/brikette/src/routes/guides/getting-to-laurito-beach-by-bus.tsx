// src/routes/guides/getting-to-laurito-beach-by-bus.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { Grid } from "@acme/ui/atoms/Grid";

import { CfResponsiveImage } from "@/components/images/CfResponsiveImage";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideSlug } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { ensureCanonicalLinkCluster } from "./ensureCanonicalLinkCluster";
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

const resolveLangFromLinksArgs = (
  args: Parameters<LinksFunction>[0] | undefined,
): AppLanguage => {
  const dataLang =
    typeof (args?.data as { lang?: string } | null | undefined)?.lang === "string"
      ? (args?.data as { lang?: string }).lang
      : undefined;
  const paramLang = typeof args?.params?.["lang"] === "string" ? args.params["lang"] : undefined;
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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry)
  throw new Error("guide manifest entry missing for lauritoBeachBusDown"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs

const { Component, clientLoader, meta, links: routeLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: buildLauritoBusDownLead,
    relatedGuides: {
      items: [
        { key: "lauritoBeachBusBack" },
        { key: "positanoBeaches" },
        { key: "beaches" },
      ],
    },
    alsoHelpful: {
      tags: ["beaches", "bus", "positano"],
      excludeGuide: ["lauritoBeachBusBack", "positanoBeaches", "beaches"],
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
export const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const [firstArg] = args;
  const descriptors = routeLinks(...args);
  return ensureCanonicalLinkCluster(descriptors, () => {
    const lang = resolveLangFromLinksArgs(firstArg);
    const path = guideHref(lang, GUIDE_KEY);
    const request =
      firstArg && typeof firstArg === "object" && "request" in firstArg
        ? (firstArg as { request?: Request }).request
        : undefined;
    const origin = resolveOrigin(request instanceof Request ? request : undefined);
    return buildRouteLinks({ lang, path, origin });
  });
};

function buildLauritoBusDownLead(context: GuideSeoTemplateContext) {
  const figures = buildFigureCopy(context);

  return (
    <div className="space-y-4">
      <Grid columns={{ base: 1, sm: 2 }} gap={4}>
        {FIGURE_SOURCES.map(({ src, width, height }, index) => {
          const copy = figures[index];
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
}

type LeadFigureCopy = { alt: string; caption: string } | undefined;

function buildFigureCopy(context: GuideSeoTemplateContext): LeadFigureCopy[] {
  const key = `content.${GUIDE_KEY}.lead.figures`;
  const local = context.translateGuides(key, { returnObjects: true }) as unknown;
  const fallback = getEnglishTranslator(context)?.(key, { returnObjects: true }) as unknown;

  const normalise = (value: unknown): LeadFigureCopy[] => {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => {
      if (!entry || typeof entry !== "object") return undefined;
      const record = entry as Record<string, unknown>;
      const alt = readMeaningfulString(record["alt"]);
      const caption = readMeaningfulString(record["caption"]);
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
