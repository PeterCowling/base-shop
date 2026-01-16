// src/routes/guides/inside-a-limoncello-factory-amalfi-coast.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { toAppLanguage } from "@/utils/lang";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["cuisine", "amalfi", "praiano"] };

export const GUIDE_KEY = "limoncelloFactory" as const satisfies GuideKey;
export const GUIDE_SLUG = "inside-a-limoncello-factory-amalfi-coast" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) throw new Error("guide manifest entry missing for limoncelloFactory");

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      ogType: "article",
      includeTwitterUrl: true,
      isPublished,
    });
  };
}

type LimoncelloExtras = {
  hasStructured: boolean;
  fallbackParagraph: string | null;
};

function collectLimoncelloExtras(context: GuideSeoTemplateContext): LimoncelloExtras {
  if (context.hasLocalizedContent) {
    return { hasStructured: true, fallbackParagraph: null };
  }
  try {
    const key = `content.${GUIDE_KEY}.fallbackParagraph` as const;
    const raw = context.translateGuides(key) as unknown;
    const paragraph = typeof raw === "string" ? raw.trim() : "";
    if (!paragraph || paragraph === key) return { hasStructured: false, fallbackParagraph: null };
    return { hasStructured: false, fallbackParagraph: paragraph };
  } catch {
    return { hasStructured: false, fallbackParagraph: null };
  }
}

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: collectLimoncelloExtras,
  render: (context, extras) => {
    if (context.hasLocalizedContent || !extras.fallbackParagraph) return null;
    return (
      <div className="space-y-4">
        <p>{extras.fallbackParagraph}</p>
      </div>
    );
  },
  isStructured: (extras, context) => context.hasLocalizedContent && extras.hasStructured,
  selectTocItems: () => [],
});

const buildGuideLinks: LinksFunction = (args) => {
  const payload = (args?.data ?? {}) as { lang?: string } | undefined;
  const lang = toAppLanguage(payload?.lang);
  const path = guideHref(lang, manifestEntry.key);
  return buildRouteLinks({ lang, path });
};

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    suppressUnlocalizedFallback: true,
    articleLead: structuredLead.articleLead,
    relatedGuides: {
      items: [
        { key: "limoncelloCuisine" },
        { key: "cuisineAmalfiGuide" },
        { key: "tramontiWineries" },
      ],
    },
  }),
  structuredArticle: structuredLead.structuredArticle,
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    manifestEntry.status === "live",
  ),
  links: (args) => buildGuideLinks(args),
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = (args) => buildGuideLinks(args);