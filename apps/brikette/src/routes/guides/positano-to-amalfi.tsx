// src/routes/guides/positano-to-amalfi.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey, type GuideAreaSlugKey } from "./guide-manifest";
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["transport", "amalfi", "positano", "ferry", "bus"] };

export const GUIDE_KEY = "positanoAmalfi" satisfies GuideKey;
export const GUIDE_SLUG = "positano-to-amalfi" as const;

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

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    includeHowToStructuredData: true,
    buildHowToSteps: buildHowToSteps,
    relatedGuides: {
      items: [
        { key: "sitaTickets" },
        { key: "ferrySchedules" },
        { key: "positanoRavello" },
      ],
    },
    alsoHelpful: {
      tags: ["transport", "amalfi", "bus", "ferry", "positano"],
      excludeGuide: ["sitaTickets", "ferrySchedules", "positanoRavello"],
      includeRooms: true,
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    guideAreaToSlugKey(manifestEntry.primaryArea),
    manifestEntry.status === "live",
  ),
});

const links: LinksFunction = (...args: Parameters<LinksFunction>) => {
  const descriptors = baseLinks(...args);
  return descriptors.length > 0 ? descriptors : buildRouteLinks();
};

export default Component;
export { clientLoader, meta, links };

function buildHowToSteps(context: GuideSeoTemplateContext) {
  const raw = context.translateGuides(`content.${GUIDE_KEY}.howTo.steps`, { returnObjects: true });
  const steps = ensureArray<{ name?: string; text?: unknown }>(raw)
    .map((entry) => {
      const name = typeof entry?.name === "string" ? entry.name.trim() : "";
      if (!name) return null;
      const textSegments = ensureStringArray(entry?.text)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0);
      const text = textSegments.length > 0 ? textSegments.join(" ") : undefined;
      return text ? { name, text } : { name };
    })
    .filter((entry): entry is { name: string; text?: string } => entry != null);

  return steps.length > 0 ? steps : null;
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
