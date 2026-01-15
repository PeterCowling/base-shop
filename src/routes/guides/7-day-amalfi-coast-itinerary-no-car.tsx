// src/routes/guides/7-day-amalfi-coast-itinerary-no-car.tsx
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import i18n from "@/i18n";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import type { RawFaqEntry } from "@/utils/buildFaqJsonLd";
import type { LinksFunction, MetaFunction } from "react-router";

export const handle = { tags: ["itinerary", "amalfi", "no-car"] };

export const GUIDE_KEY: GuideKey = "sevenDayNoCar";
export const GUIDE_SLUG = "7-day-amalfi-coast-itinerary-no-car" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for sevenDayNoCar");
}

const OG_IMAGE_PATH = "/img/hostel-communal-terrace-lush-view.webp";

const {
  Component,
  clientLoader: routeClientLoader,
  links: routeLinks,
  meta: routeMeta,
} = defineGuideRoute(manifestEntry, {
  template: () => ({
    relatedGuides: {
      items: [{ key: "itinerariesPillar" }, { key: "positanoTravelGuide" }, { key: "dayTripsAmalfi" }],
    },
    suppressUnlocalizedFallback: false,
    guideFaqFallback: (lang: string) => {
      try {
        const fixed = i18n.getFixedT?.(lang, "guidesFallback");
        if (typeof fixed !== "function") return [];
        const collect = (segment: string) =>
          ensureArray<Record<string, unknown>>(fixed(`content.${GUIDE_KEY}.${segment}`, { returnObjects: true }));
        const candidates = [...collect("faq"), ...collect("faqs")];
        const mapped = candidates
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const questionRaw =
              typeof entry.q === "string"
                ? entry.q
                : typeof entry.question === "string"
                ? entry.question
                : undefined;
            const answers = ensureStringArray(entry.a ?? entry.answer);
            if (answers.length === 0) return null;
            const question =
              typeof questionRaw === "string" && questionRaw.trim().length > 0 ? questionRaw.trim() : undefined;
            return { q: question, a: answers };
          })
          .filter((entry): entry is { q?: string; a: string[] } => entry != null);
        if (process.env.DEBUG_FAQ_FALLBACK === "1") {
          // eslint-disable-next-line no-console
          console.log("[sevenDayNoCar] guideFaqFallback", lang, mapped);
        }
        return mapped;
      } catch {
        return [];
      }
    },
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
    const path = `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, manifestEntry.key)}`;
    const image = buildCfImageUrl(OG_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
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
});

export default Component;
export const clientLoader = routeClientLoader;
export const links: LinksFunction = (args) => {
  const resolved = routeLinks(args);
  if (Array.isArray(resolved) && resolved.length > 0) {
    return resolved;
  }
  const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: AppLanguage } | undefined;
  const lang = payload?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const baseKey = guideAreaToSlugKey(manifestEntry.primaryArea);
  const areaSlug = getSlug(baseKey, lang);
  const path = `/${lang}/${areaSlug}/${guideSlug(lang, manifestEntry.key)}`;
  return buildRouteLinks({ lang, path, origin: BASE_URL });
};
export const meta: MetaFunction = (args) => routeMeta(args);