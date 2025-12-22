// src/routes/guides/how-to-get-to-positano.tsx
import { memo, useCallback } from "react";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";

import GuideSeoTemplate from "./_GuideSeoTemplate";
import { renderArticleLead } from "./how-to-get-to-positano.article-lead";
import { renderAdditionalScripts } from "./how-to-get-to-positano.additional-scripts";
import { buildBreadcrumb } from "./how-to-get-to-positano.breadcrumb";
import { ALSO_HELPFUL_TAGS, OG_IMAGE, RELATED_GUIDES } from "./how-to-get-to-positano.constants";
import type { GuideKey } from "@/routes.guides-helpers";
import { buildGuideExtras } from "./how-to-get-to-positano.extras";
import { buildGuideFaqFallback } from "./how-to-get-to-positano.faq";
export { handle } from "./how-to-get-to-positano.metadata";
import { buildTocItems } from "./how-to-get-to-positano.toc";
import type { MetaFunction, LinksFunction } from "react-router";
import type { AppLanguage } from "@/i18n.config";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";

function HowToGetToPositano(): JSX.Element {
  const buildExtras = useCallback(buildGuideExtras, []);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => renderArticleLead(context, buildExtras),
    [buildExtras],
  );

  const tocItems = useCallback(
    (context: GuideSeoTemplateContext) => buildTocItems(context, buildExtras),
    [buildExtras],
  );

  const guideFaqFallback = useCallback((targetLang: string) => buildGuideFaqFallback(targetLang), []);

  const additionalScripts = useCallback(renderAdditionalScripts, []);

  const breadcrumb = useCallback(buildBreadcrumb, []);

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={OG_IMAGE}
      articleLead={articleLead}
      buildTocItems={tocItems}
      buildBreadcrumb={breadcrumb}
      guideFaqFallback={guideFaqFallback}
      additionalScripts={additionalScripts}
      renderGenericContent={false}
      relatedGuides={{ items: RELATED_GUIDES }}
      alsoHelpful={{
        tags: [...ALSO_HELPFUL_TAGS],
        excludeGuide: RELATED_GUIDES.map((item) => item.key),
        includeRooms: true,
      }}
    />
  );
}

export default memo(HowToGetToPositano);

export { buildGuideExtras } from "./how-to-get-to-positano.extras";
export { renderAdditionalScripts } from "./how-to-get-to-positano.additional-scripts";
export { renderArticleLead } from "./how-to-get-to-positano.article-lead";
export {
  safeString,
  normaliseSections,
  normaliseWhenItems,
  normaliseFaqs,
} from "./how-to-get-to-positano.normalizers";

// Route head exports – canonical/hreflang + OG/Twitter (incl. twitter:card)
export const GUIDE_KEY = "howToGetToPositano" satisfies GuideKey;
export const GUIDE_SLUG = "how-to-get-to-positano" as const;
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lang = ((data || {}) as { lang?: AppLanguage }).lang || ("en" as AppLanguage);
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

