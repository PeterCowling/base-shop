// src/routes/guides/thrifty-souvenir-shopping-amalfi-coast.tsx
import type { LinksFunction } from "react-router";

import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { OG_IMAGE as OG_DIMS } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["souvenirs", "budgeting", "amalfi", "positano"] };

export const GUIDE_KEY = "souvenirsAmalfi" as const satisfies GuideKey;
export const GUIDE_SLUG = "thrifty-souvenir-shopping-amalfi-coast" as const;

function buildSouvenirToc(context: GuideSeoTemplateContext) {
  try {
    const raw = context.translator(`content.${context.guideKey}.toc`, { returnObjects: true }) as unknown;
    const arr = Array.isArray(raw) ? (raw as Array<{ href?: unknown; label?: unknown }>) : [];
    const filtered = arr
      .map((it) => {
        const href = typeof it?.href === "string" ? it.href.trim() : "";
        const label = typeof it?.label === "string" ? it.label.trim() : "";
        if (!href || !label) return null;
        return { href, label } as const;
      })
      .filter((entry): entry is { href: string; label: string } => entry != null);
    return filtered;
  } catch {
    return [];
  }
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for souvenirsAmalfi"); // i18n-exempt -- TECH-000 [ttl=2026-12-31]
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferManualWhenUnlocalized: true,
    buildTocItems: buildSouvenirToc,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const areaSlug = getSlug(guideAreaToSlugKey(manifestEntry.primaryArea), lang);
    const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_DIMS.width,
      height: OG_DIMS.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_DIMS.width, height: OG_DIMS.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();
