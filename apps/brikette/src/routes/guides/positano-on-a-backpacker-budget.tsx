// src/routes/guides/positano-on-a-backpacker-budget.tsx
import { memo, useCallback } from "react";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";

import { buildGuideExtras } from "./positano-on-a-backpacker-budget/buildGuideExtras";
import { createArticleLead } from "./positano-on-a-backpacker-budget/_createArticleLead";
import { createGuideFaqFallback } from "./positano-on-a-backpacker-budget/createGuideFaqFallback";
import { createTocBuilder } from "./positano-on-a-backpacker-budget/createTocBuilder";
import * as BB from "./positano-on-a-backpacker-budget/constants";
import type { MetaFunction, LinksFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";

export { handle } from "./positano-on-a-backpacker-budget/constants";

function BackpackerBudgetItineraries(): JSX.Element {
  const buildExtras = useCallback(buildGuideExtras, []);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => createArticleLead(buildExtras, context),
    [buildExtras],
  );

  const buildTocItems = useCallback(
    (context: GuideSeoTemplateContext) => createTocBuilder(buildExtras, context),
    [buildExtras],
  );

  const guideFaqFallback = useCallback(createGuideFaqFallback, []);

  return (
    <GuideSeoTemplate
      guideKey={BB.GUIDE_KEY}
      metaKey={BB.GUIDE_KEY}
      ogImage={BB.OG_IMAGE}
      articleLead={articleLead}
      buildTocItems={buildTocItems}
      guideFaqFallback={guideFaqFallback}
      renderGenericContent={false}
      relatedGuides={BB.RELATED_GUIDES}
    />
  );
}

export default memo(BackpackerBudgetItineraries);

// Export guide identity constants for this route
export const GUIDE_KEY = BB.GUIDE_KEY;
export const GUIDE_SLUG = BB.GUIDE_SLUG;

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, BB.GUIDE_KEY, {
    en: () => import("../../locales/en/guides/content/backpackerItineraries.json"),
    local:
      lang === "en"
        ? undefined
        : () =>
            import(`../../locales/${lang}/guides/content/backpackerItineraries.json`).catch(
              () => undefined,
            ),
  });
  return { lang } as const;
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, BB.GUIDE_KEY)}`;
  const image = buildCfImageUrl(BB.OG_IMAGE.path, {
    width: BB.OG_IMAGE.width,
    height: BB.OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  const title = `guides.meta.${BB.GUIDE_KEY}.title`;
  const description = `guides.meta.${BB.GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: BB.OG_IMAGE.width, height: BB.OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

