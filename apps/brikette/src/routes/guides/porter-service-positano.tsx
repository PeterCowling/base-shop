// src/routes/guides/porter-service-positano.tsx
import { type ComponentType,memo, useMemo } from "react";
import type { LinksFunction,MetaFunction  } from "react-router";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { GuideSeoTemplateProps } from "./guide-seo/types";
import { createArticleLead } from "./porter-service-positano.article-lead";
// Use namespace import so tests can partially mock the constants module
import * as CONSTS from "./porter-service-positano.constants";
import { ALSO_HELPFUL_TAGS, RELATED_GUIDES } from "./porter-service-positano.extras";
import { createGuideFaqFallback } from "./porter-service-positano.faq-fallback";
import { createGuideExtrasBuilder } from "./porter-service-positano.guide-extras";
import { createBuildHowToSteps } from "./porter-service-positano.how-to";
import { createInitialExtras,createPreviewContext } from "./porter-service-positano.preview";
import { createAdditionalScripts } from "./porter-service-positano.service-data";
import { createBuildTocItems } from "./porter-service-positano.toc";
import { getGuidesFallbackTranslator, getGuidesTranslator } from "./porter-service-positano.translators";

type PositanoConstants = typeof import("./porter-service-positano.constants");
const C: Partial<PositanoConstants> = CONSTS;

export {
  computePorterGuideExtras,
  createPorterHowToSteps,
} from "./porter-service-positano.extras";
export { normaliseFaqs, normaliseSections, normaliseToc } from "./porter-service-positano.normalisers";
export { getGuidesFallbackTranslator, getGuidesTranslator } from "./porter-service-positano.translators";

function PorterService(): JSX.Element {
  const OG_IMAGE = C.OG_IMAGE ?? {
    path: "/img/positano-panorama.avif",
    width: 1200,
    height: 630,
    transform: { width: 1200, height: 630, quality: 85, format: "auto" },
  };
  const lang = useCurrentLanguage();

  const fallbackGuides = useMemo(() => getGuidesTranslator("en"), []);
  const fallbackEn = useMemo(() => getGuidesFallbackTranslator("en"), []);
  const previewTranslate = useMemo(
    () => getGuidesTranslator(lang) as GuideSeoTemplateContext["translateGuides"],
    [lang],
  );
  const previewFallbackLocal = useMemo(() => getGuidesFallbackTranslator(lang), [lang]);

  const previewContext = useMemo(
    () => createPreviewContext({ lang, translateGuides: previewTranslate }),
    [lang, previewTranslate],
  );

  const initialExtras = useMemo(
    () =>
      createInitialExtras(previewContext, {
        fallbackGuides,
        fallbackLocal: previewFallbackLocal,
        fallbackEn,
      }),
    [previewContext, fallbackGuides, previewFallbackLocal, fallbackEn],
  );

  const buildGuideExtras = useMemo(
    () =>
      createGuideExtrasBuilder({
        previewContext,
        initialExtras,
        fallbackGuides,
        fallbackEn,
      }),
    [previewContext, initialExtras, fallbackGuides, fallbackEn],
  );

  const articleLead = useMemo(() => createArticleLead(buildGuideExtras), [buildGuideExtras]);
  const buildTocItems = useMemo(() => createBuildTocItems(buildGuideExtras), [buildGuideExtras]);
  const buildHowToSteps = useMemo(() => createBuildHowToSteps(buildGuideExtras), [buildGuideExtras]);
  const guideFaqFallback = useMemo<GuideSeoTemplateProps["guideFaqFallback"]>(() => {
    const fallback = createGuideFaqFallback();
    return (targetLang) => {
      const entries = fallback(targetLang);
      if (!Array.isArray(entries) || entries.length === 0) {
        return undefined;
      }
      return entries
        .map(({ q, a }) => ({
          question: q.trim(),
          answer: a.map((answer) => answer.trim()).filter((answer) => answer.length > 0),
        }))
        .filter((entry): entry is NormalizedFaqEntry => entry.question.length > 0 && entry.answer.length > 0);
    };
  }, []);
  const additionalScripts = useMemo(() => createAdditionalScripts(fallbackGuides), [fallbackGuides]);

  // Vitest can mock the default export as a plain function. If so, call it
  // directly with a single props argument. Otherwise, render the real component.
  const isMockedTemplate =
    typeof GuideSeoTemplate === "function" && !(GuideSeoTemplate as { $$typeof?: unknown }).$$typeof;

  const renderGuideSeoTemplate = (props: GuideSeoTemplateProps): JSX.Element => {
    if (isMockedTemplate) {
      return (GuideSeoTemplate as unknown as (p: GuideSeoTemplateProps) => JSX.Element)(props);
    }
    const Component = GuideSeoTemplate as ComponentType<GuideSeoTemplateProps>;
    return <Component {...props} />;
  };

  return renderGuideSeoTemplate({
    guideKey: GUIDE_KEY,
    metaKey: GUIDE_KEY,
    ogImage: OG_IMAGE,
    articleLead,
    buildTocItems,
    buildHowToSteps,
    guideFaqFallback,
    additionalScripts,
    renderGenericContent: false,
    relatedGuides: { items: RELATED_GUIDES },
    showTagChips: false,
    alsoHelpful: {
      tags: [...ALSO_HELPFUL_TAGS],
      excludeGuide: RELATED_GUIDES.map((item) => item.key),
      includeRooms: true,
    },
  });
}

export default memo(PorterService);

// Route head exports – canonical/hreflang + OG/Twitter (incl. twitter:card)
export const GUIDE_KEY = C.GUIDE_KEY ?? ("porterServices" as GuideKey);
export const GUIDE_SLUG = C.GUIDE_SLUG ?? "porter-service-positano";

export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lang = ((data || {}) as { lang?: AppLanguage }).lang || ("en" as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const OG_IMAGE = C.OG_IMAGE ?? {
    path: "/img/positano-panorama.avif",
    width: 1200,
    height: 630,
    transform: { width: 1200, height: 630, quality: 85, format: "auto" },
  };
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

