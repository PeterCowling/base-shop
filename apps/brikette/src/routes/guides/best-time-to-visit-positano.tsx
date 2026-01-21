// src/routes/guides/best-time-to-visit-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import GuideMonthsItemListStructuredData from "@/components/seo/GuideMonthsItemListStructuredData";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

export const handle = { tags: ["seasonal", "positano"] };

export const GUIDE_KEY: GuideKey = "bestTimeToVisit";
export const GUIDE_SLUG = "best-time-to-visit-positano" as const;

const SEASONAL_GENERIC_CONTENT_TEST_ID = "seasonal-generic-content" as const;
// i18n-exempt -- TEST-000 [ttl=2026-12-31] Test identifier

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI invariant
  throw new Error("guide manifest entry missing for bestTimeToVisit");
}

const { Component, clientLoader, meta: baseMeta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    genericContentOptions: { showToc: true },
    renderGenericWhenEmpty: true,
    preferGenericWhenFallback: true,
    articleExtras: () => <div data-testid={SEASONAL_GENERIC_CONTENT_TEST_ID} />,
    additionalScripts: ({ article, canonicalUrl }) => (
      <GuideMonthsItemListStructuredData
        guideKey={GUIDE_KEY}
        name={article.title}
        canonicalUrl={canonicalUrl}
      />
    ),
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
    const image = buildCfImageUrl(DEFAULT_OG_IMAGE.path, {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
});

export default Component;
export { clientLoader };
export const meta: MetaFunction = (...args) => baseMeta(...args);
export const links: LinksFunction = () => buildRouteLinks();
