import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { normalizeGuideToc } from "./guide-seo/toc";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

export const handle = { tags: ["solo-travel", "safety", "positano", "hostel-life"] };

export const GUIDE_KEY: GuideKey = "soloTravelPositano";
export const GUIDE_SLUG = "solo-travel-positano-tips" as const;

function buildSoloTravelToc(ctx: GuideSeoTemplateContext) {
  try {
    const normalized = normalizeGuideToc(ctx, {
      customBuilderProvided: true,
      suppressUnlocalizedFallback: true,
    });
    if (!Array.isArray(normalized) || normalized.length === 0) return null;

    const seen = new Set<string>();
    const deduped = normalized.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const href = typeof item.href === "string" ? item.href.trim() : "";
      const label = typeof item.label === "string" ? item.label.trim() : "";
      if (!href || !label) return false;
      const key = `${href.toLowerCase()}::${label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped.length > 0 ? deduped : null;
  } catch {
    return null;
  }
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-facing safeguard surfaced during misconfiguration
  throw new Error("guide manifest entry missing for soloTravelPositano");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    showTocWhenUnlocalized: false,
    showTransportNotice: false,
    showTagChips: true,
    genericContentOptions: { showToc: false },
    buildTocItems: buildSoloTravelToc,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/positano-panorama.avif", {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (_args, _entry, base) => {
    const shared = buildRouteLinks();
    return shared.length > 0 ? shared : base;
  },
});

export default Component;
export { clientLoader, links,meta };
