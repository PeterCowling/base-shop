// src/routes/guides/positano-to-pompeii.tsx
import type { LinksFunction, MetaFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, type GuideAreaSlugKey,guideAreaToSlugKey } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["transport", "pompeii", "train", "bus"] };

export const GUIDE_KEY = "positanoPompeii" satisfies GuideKey;
export const GUIDE_SLUG = "positano-to-pompeii" as const;

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
  throw new Error("guide manifest entry missing for positanoPompeii"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
}

const { Component, clientLoader, meta, links: baseLinks } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    includeHowToStructuredData: true,
    buildHowToSteps: buildPompeiiHowToSteps,
    relatedGuides: {
      items: [
        { key: "sitaTickets" },
        { key: "ferrySchedules" },
        { key: "whatToPack" },
      ],
    },
    alsoHelpful: {
      tags: ["transport", "pompeii", "train", "bus", "positano"],
      excludeGuide: ["sitaTickets", "ferrySchedules", "whatToPack"],
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
export { clientLoader, links,meta };

function buildPompeiiHowToSteps(context: GuideSeoTemplateContext) {
  const rawSteps = context.translateGuides(`content.${GUIDE_KEY}.howTo.steps`, { returnObjects: true });
  const steps = ensureArray<{ name?: string; text?: unknown }>(rawSteps)
    .map((entry) => {
      const name = typeof entry?.name === "string" ? entry.name.trim() : "";
      if (!name) return null;
      const textSegments = ensureStringArray(entry?.text)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0);
      if (textSegments.length === 0) {
        return { name };
      }
      return { name, text: textSegments.join(" ") };
    })
    .filter((entry): entry is { name: string; text?: string } => entry != null);

  if (steps.length === 0) return null;
  return { steps, extras: { totalTime: "PT2H" } } as const;
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
