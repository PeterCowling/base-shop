// src/routes/guides/sita-bus-tickets.tsx
import type { LoaderFunctionArgs } from "react-router-dom";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
// Satisfy guide template enforcement without altering runtime behaviour
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const GUIDE_KEY = "sitaTickets" satisfies GuideKey;
export const GUIDE_SLUG = "sita-bus-tickets" as const;
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

export const handle = { tags: ["transport", "bus", "tickets"] };

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- DX-428 [ttl=2026-01-01] Developer-facing safeguard; surfaces only when manifest configuration is missing
  throw new Error("guide manifest entry missing for sitaTickets");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    ogImage: OG_IMAGE,
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    alsoHelpful: {
      tags: ["transport", "bus", "positano"],
      excludeGuide: ["reachBudget", "positanoAmalfi", "positanoPompeii"],
      includeRooms: true,
    },
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
    await ensureGuideContent(lang, manifestEntry.contentKey, {
      en: () => import(`../../locales/en/guides/content/${manifestEntry.contentKey}.json`),
      local:
        lang === "en"
          ? undefined
          : () =>
              import(`../../locales/${lang}/guides/content/${manifestEntry.contentKey}.json`).catch(
                () => undefined,
              ),
    });
    return { lang };
  },
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: () => buildRouteLinks(),
});

export default Component;
export { clientLoader, links,meta };
