// src/routes/guides/fiordo-di-furore-bus-return.tsx
import { memo, useCallback } from "react";

import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";

import { OG_IMAGE, GUIDE_KEY as ROUTE_GUIDE_KEY, GUIDE_SLUG as ROUTE_GUIDE_SLUG } from "./fiordo-di-furore-bus-return/constants";
import { createGuideFaqFallback } from "./fiordo-di-furore-bus-return/guideFaqFallback";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { guideHref, guideAbsoluteUrl } from "@/routes.guides-helpers";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";

export const handle = { tags: ["beaches", "bus", "amalfi"] };

// i18n-exempt -- Guide identifier used for localisation lookups; copy lives in locale bundles
export const GUIDE_KEY = ROUTE_GUIDE_KEY satisfies GuideKey;
export const GUIDE_SLUG = ROUTE_GUIDE_SLUG;
export { OG_IMAGE };

function FiordoDiFuroreBusReturn(): JSX.Element {
  const guideFaqFallback = useCallback((lang: string) => createGuideFaqFallback(lang), []);
  const articleLead = useCallback(() => null, []);
  const articleExtras = useCallback(() => null, []);

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={OG_IMAGE}
      guideFaqFallback={guideFaqFallback}
      articleLead={articleLead}
      articleExtras={articleExtras}
      relatedGuides={{
        items: [
          { key: "positanoBeaches" },
          { key: "positanoMainBeachBusBack" },
          { key: "hostelBriketteToFornilloBeach" },
        ],
      }}
      alsoHelpful={{
        tags: ["beaches", "bus", "positano"],
        excludeGuide: [
          "positanoBeaches",
          "positanoMainBeachBusBack",
          "hostelBriketteToFornilloBeach",
        ],
        includeRooms: true,
      }}
    />
  );
}

export default memo(FiordoDiFuroreBusReturn);

// Head exports – canonical/hreflang + OG/Twitter (incl. twitter:card)
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: string };
  const lang = (d.lang as AppLanguage) || (i18nConfig.fallbackLng as AppLanguage);
  const path = guideHref(lang, GUIDE_KEY);
  const url = guideAbsoluteUrl(lang, GUIDE_KEY);
  const imgWidth = OG_IMAGE.transform?.width ?? OG_IMAGE.width ?? 1200;
  const imgHeight = OG_IMAGE.transform?.height ?? OG_IMAGE.height ?? 630;
  const imgQuality = OG_IMAGE.transform?.quality ?? 85;
  const imageSrc = buildCfImageUrl(OG_IMAGE.path, {
    width: imgWidth,
    height: imgHeight,
    quality: imgQuality,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: imageSrc, width: imgWidth, height: imgHeight },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = (..._args) => buildRouteLinks();

