// src/routes/guides/sorrento-gateway-guide.tsx
import { memo } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import GenericContent from "@/components/guides/GenericContent";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["sorrento", "transport", "comparison", "day-trip"] };

export const GUIDE_KEY = "sorrentoGuide" as const satisfies GuideKey;
export const GUIDE_SLUG = "sorrento-gateway-guide" as const;

function hasGatewayContent(context: GuideSeoTemplateContext): boolean {
  const translator = context.translateGuides;
  if (typeof translator !== "function") return false;

  const normaliseIntro = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  };

  const normaliseSections = (
    value: unknown,
  ): Array<{ title: string; body: string[] }> => {
    if (!Array.isArray(value)) return [];
    return value
      .map((section) => {
        if (!section || typeof section !== "object") {
          return { title: "", body: [] };
        }
        const candidate = section as { title?: unknown; body?: unknown; items?: unknown };
        const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
        const rawBody = Array.isArray(candidate.body)
          ? candidate.body
          : Array.isArray(candidate.items)
            ? candidate.items
            : [];
        const body = rawBody
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter((entry) => entry.length > 0);
        return { title, body };
      })
      .filter((section) => section.title.length > 0 || section.body.length > 0);
  };

  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value.toLowerCase() === b[index]?.toLowerCase());
  };

  const sectionsEqual = (
    a: Array<{ title: string; body: string[] }>,
    b: Array<{ title: string; body: string[] }>,
  ): boolean => {
    if (a.length !== b.length) return false;
    return a.every((section, index) => {
      const other = b[index];
      if (!other) return false;
      const titlesMatch = section.title.toLowerCase() === other.title.toLowerCase();
      const bodiesMatch = arraysEqual(section.body, other.body);
      return titlesMatch && bodiesMatch;
    });
  };

  const lang = context.lang ?? "en";
  const translatorEn = typeof context.translateGuidesEn === "function" ? context.translateGuidesEn : undefined;

  try {
    const introRaw = translator("content.sorrentoGatewayGuide.intro", { returnObjects: true }) as unknown;
    const intro = normaliseIntro(introRaw);
    if (intro.length > 0) {
      if (lang !== "en" && translatorEn) {
        try {
          const introEn = normaliseIntro(
            translatorEn("content.sorrentoGatewayGuide.intro", { returnObjects: true }) as unknown,
          );
          if (!arraysEqual(intro, introEn)) {
            return true;
          }
        } catch {
          return true;
        }
      } else {
        return true;
      }
    }
  } catch {
    /* noop */
  }

  try {
    const sectionsRaw = translator("content.sorrentoGatewayGuide.sections", { returnObjects: true }) as unknown;
    const sections = normaliseSections(sectionsRaw);
    if (sections.length > 0) {
      if (lang !== "en" && translatorEn) {
        try {
          const sectionsEn = normaliseSections(
            translatorEn("content.sorrentoGatewayGuide.sections", { returnObjects: true }) as unknown,
          );
          if (!sectionsEqual(sections, sectionsEn)) {
            return true;
          }
        } catch {
          return true;
        }
      } else {
        return true;
      }
    }
  } catch {
    /* noop */
  }

  return false;
}

function SorrentoGuide(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      relatedGuides={{ items: [{ key: "naplesPositano" }, { key: "reachBudget" }, { key: "compareBasesPositanoSorrentoAmalfi" }] }}
      // Provide a minimal custom ToC only when gateway content exists so the
      // template suppresses GenericContent's ToC to avoid duplicate navigation.
      buildTocItems={(context) => {
        if (hasGatewayContent(context)) {
          // Return a single harmless item to signal presence; the template
          // will suppress GenericContent's ToC while a route-specific guard
          // in StructuredTocBlock prevents rendering this nav.
          return [{ href: "#gateway", label: "Gateway" }];
        }
        return [];
      }}
      // Compose content from a "gateway" page plus the main Sorrento guide fallback.
      // Render the gateway content first (in the article lead) so tests see
      // GenericContent invoked for `sorrentoGatewayGuide` before the main guide.
      articleLead={(ctx) => {
        const hasGateway = hasGatewayContent(ctx);
        return (
          <>
            {hasGateway ? (
              <GenericContent
                guideKey={"sorrentoGatewayGuide" as GuideKey}
                t={ctx.translateGuides}
                showToc={false}
              />
            ) : null}
          </>
        );
      }}
    />
  );
}

export default memo(SorrentoGuide);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "sorrentoGuide", {
    en: () => import("../../locales/en/guides/content/sorrentoGuide.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/sorrentoGuide.json`).catch(() => undefined),
  });
  return { lang } as const;
}

// Prefer shared head helpers so lints can verify descriptors
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lang = ((data as { lang?: string } | undefined)?.lang ?? "en") as AppLanguage;
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/positano-panorama.avif", {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  // Resolve title/description with graceful fallbacks:
  // 1) Prefer explicit guides.meta.{key} values when non-blank
  // 2) Otherwise fall back to guides.content.{key}.seo values (locale → EN)
  const tGuides = i18n.getFixedT(lang, "guides") as (key: string, opts?: unknown) => unknown;
  const tGuidesEn = i18n.getFixedT("en", "guides") as (key: string, opts?: unknown) => unknown;
  const isMeaningful = (value: unknown, key: string): value is string =>
    typeof value === "string" && value.trim().length > 0 && value.trim() !== key;

  const metaTitleKey = `meta.${GUIDE_KEY}.title` as const;
  const metaDescKey = `meta.${GUIDE_KEY}.description` as const;
  const seoTitleKey = `content.${GUIDE_KEY}.seo.title` as const;
  const seoDescKey = `content.${GUIDE_KEY}.seo.description` as const;

  const rawMetaTitle = tGuides(metaTitleKey);
  const rawMetaDesc = tGuides(metaDescKey);

  const title = isMeaningful(rawMetaTitle, metaTitleKey)
    ? (rawMetaTitle as string).trim()
    : ((): string => {
        const localSeo = tGuides(seoTitleKey);
        if (isMeaningful(localSeo, seoTitleKey)) return (localSeo as string).trim();
        const enSeo = tGuidesEn(seoTitleKey);
        if (isMeaningful(enSeo, seoTitleKey)) return (enSeo as string).trim();
        // As a last resort, fall back to the guide key
        return GUIDE_KEY;
      })();

  const description = isMeaningful(rawMetaDesc, metaDescKey)
    ? (rawMetaDesc as string).trim()
    : ((): string => {
        const localSeo = tGuides(seoDescKey);
        if (isMeaningful(localSeo, seoDescKey)) return (localSeo as string).trim();
        const enSeo = tGuidesEn(seoDescKey);
        if (isMeaningful(enSeo, seoDescKey)) return (enSeo as string).trim();
        return "";
      })();

  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
