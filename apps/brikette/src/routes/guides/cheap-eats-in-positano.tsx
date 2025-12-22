// src/routes/guides/cheap-eats-in-positano.tsx
import type {} from "@/routes/guides/_GuideSeoTemplate";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry, guideAreaToSlugKey } from "./guide-manifest";

import { CheapEatsArticle } from "@/routes/guides/cheapEatsInPositano/CheapEatsArticle";
import CheapEatsMetaBridge from "@/routes/guides/cheapEatsInPositano/CheapEatsMetaBridge";
import { useCheapEatsContent } from "@/routes/guides/cheapEatsInPositano/useCheapEatsContent";

import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { LoaderFunctionArgs } from "react-router-dom";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { LinksFunction } from "react-router";

export const handle = { tags: ["cuisine", "positano", "budgeting"] };

export const GUIDE_KEY: GuideKey = "cheapEats";
export const GUIDE_SLUG = "cheap-eats-in-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for cheapEats"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

const { Component, clientLoader, meta } = defineGuideRoute(manifestEntry, {
  template: () => ({
    renderGenericContent: false,
    renderGenericWhenEmpty: true,
    preferGenericWhenFallback: true,
    preferManualWhenUnlocalized: true,
    relatedGuides: { items: manifestEntry.relatedGuides.map((key) => ({ key })) },
    afterArticle: () => <CheapEatsArticleBridge />,
    additionalScripts: () => <CheapEatsMetaBridge />,
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
export { clientLoader, meta };
export const links: LinksFunction = () => buildRouteLinks();

function CheapEatsArticleBridge(): JSX.Element {
  const content = useCheapEatsContent();
  return <CheapEatsArticle {...content.article} />;
}
