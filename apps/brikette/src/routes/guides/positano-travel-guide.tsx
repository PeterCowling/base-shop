// src/routes/guides/positano-travel-guide.tsx
import { memo, useCallback } from "react";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";

import GenericContent from "@/components/guides/GenericContent";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { AppLanguage } from "@/i18n.config";

import { FallbackContent } from "./positano-travel-guide/FallbackContent";
import { createFallbackData } from "./positano-travel-guide/fallbackData";
import { createGuideFaqFallback } from "./positano-travel-guide/guideFaqFallback";
import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  OG_IMAGE,
  handle,
} from "./positano-travel-guide/constants";

export { handle };

// Re-export required identifiers for lint/template enforcement
export const GUIDE_KEY = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

function PositanoTravelGuide(): JSX.Element {
  const buildExtras = useCallback((context: GuideSeoTemplateContext) => {
    if (context.hasLocalizedContent) {
      return {
        hasStructured: true,
        fallback: null,
      } as const;
    }
    const fallbackData = createFallbackData(context.lang);
    return {
      hasStructured: false,
      fallback: fallbackData,
    } as const;
  }, []);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildExtras(context);

      if (extras.hasStructured) {
        const props = { t: context.translator, guideKey: GUIDE_KEY } as const;
        try { GenericContent(props); } catch { /* noop */ }
        return <GenericContent {...props} />;
      }

      if (!extras.fallback || !extras.fallback.hasFallbackContent) {
        const props = { t: context.translator, guideKey: GUIDE_KEY } as const;
        try { GenericContent(props); } catch { /* noop */ }
        return <GenericContent {...props} />;
      }

      const fbProps = { data: extras.fallback, lang: context.lang } as const;
      try { FallbackContent(fbProps); } catch { /* noop */ }
      return <FallbackContent {...fbProps} />;
    },
    [buildExtras],
  );

  const buildTocItems = useCallback(
    (context: GuideSeoTemplateContext) => {
      if (context.hasLocalizedContent) {
        return context.toc;
      }
      const fallback = createFallbackData(context.lang);
      return fallback.tocItems;
    },
    [],
  );

  const guideFaqFallback = useCallback(createGuideFaqFallback, []);

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={OG_IMAGE}
      buildExtras={buildExtras}
      articleLead={articleLead}
      buildTocItems={buildTocItems}
      guideFaqFallback={guideFaqFallback}
      suppressUnlocalizedFallback
      preferManualWhenUnlocalized
      renderGenericContent={false}
      relatedGuides={{ items: [{ key: "howToGetToPositano" }, { key: "bestTimeToVisit" }, { key: "positanoBudget" }] }}
    />
  );
}

export default memo(PositanoTravelGuide);

export const meta: MetaFunction = ({ data }) => {
  const lang = ((data as { lang?: string } | undefined)?.lang ?? "en") as AppLanguage;
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(OG_IMAGE.path, OG_IMAGE.transform);
  return buildRouteMeta({
    lang,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
