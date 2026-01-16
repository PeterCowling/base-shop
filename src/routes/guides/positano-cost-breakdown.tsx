// src/routes/guides/positano-cost-breakdown.tsx
import { defineGuideRoute, createStructuredLeadWithBuilder } from "./defineGuideRoute";
import type { GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import CostBreakdown from "@/components/guides/CostBreakdown";
import GenericContent from "@/components/guides/GenericContent";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl, guideHref } from "@/routes.guides-helpers";
import { toAppLanguage } from "@/utils/lang";
import { BASE_URL } from "@/config/site";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  OG_IMAGE,
  handle,
} from "./positano-cost-breakdown/constants";
import { buildGuideExtras } from "./positano-cost-breakdown/extras";
import { buildGuideFaqFallback } from "./positano-cost-breakdown/guideFaqFallback";

export { handle };
export const GUIDE_KEY: GuideKey = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

function renderStructuredContent(
  extras: ReturnType<typeof buildGuideExtras>,
  context: GuideSeoTemplateContext,
): JSX.Element {
  return (
    <>
      {extras.intro.map((paragraph, index) => (
        <p key={`intro-${index}`}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {extras.tocItems.length > 0 ? (
        <TableOfContents title={extras.tocTitle} items={extras.tocItems} />
      ) : null}

      <section id="at-a-glance">
        <h2>{extras.atAGlanceLabel}</h2>
        <CostBreakdown items={extras.costItems} currency="EUR" lang={context.lang} title={extras.costTitle} />
      </section>

      {extras.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={`section-${section.id}-${index}`}>
              {renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}
            </p>
          ))}
        </section>
      ))}

      {extras.tips.length > 0 ? (
        <aside id="tips">
          {extras.tipsTitle ? <h2>{extras.tipsTitle}</h2> : null}
          <ul>
            {extras.tips.map((tip, index) => (
              <li key={`tip-${index}`}>{renderGuideLinkTokens(tip, context.lang, `tip-${index}`)}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      {extras.faqs.length > 0 ? (
        <section id="faqs">
          {extras.faqsTitle ? <h2>{extras.faqsTitle}</h2> : null}
          {extras.faqs.map((faq, index) => (
            <details key={`faq-${index}`}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={`faq-${index}-${answerIndex}`}>
                  {renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}
                </p>
              ))}
            </details>
          ))}
        </section>
      ) : null}
    </>
  );
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for positanoCostBreakdown");
}

const guideFaqFallback = buildGuideFaqFallback;

const structuredLead = createStructuredLeadWithBuilder({
  guideKey: GUIDE_KEY,
  buildExtras: (context) => buildGuideExtras(context),
  render: (context, extras) => {
    if (extras.hasStructured) {
      return renderStructuredContent(extras, context);
    }
    return <GenericContent guideKey={GUIDE_KEY} t={context.translateGuides} />;
  },
  selectTocItems: (extras) => (extras.hasStructured ? extras.tocItems : []),
  isStructured: (extras) => Boolean(extras.hasStructured),
});

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  structuredArticle: structuredLead.structuredArticle,
  template: () => ({
    ogImage: OG_IMAGE,
    articleLead: structuredLead.articleLead,
    guideFaqFallback: (lang) => guideFaqFallback(lang),
    renderGenericContent: false,
  }),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = guideHref(lang, manifestEntry.key);
    const url = guideAbsoluteUrl(lang, manifestEntry.key);
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: OG_IMAGE.transform.quality,
      format: OG_IMAGE.transform.format,
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.title`,
      description: `guides.meta.${manifestEntry.metaKey ?? manifestEntry.key}.description`,
      url,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished: manifestEntry.status === "live",
    });
  },
  links: (args: GuideLinksArgs | undefined, entry) => {
    const payload = ((args ?? {}) as { data?: unknown }).data as { lang?: string } | undefined;
    const lang = toAppLanguage(payload?.lang);
    const path = guideHref(lang, entry.key);
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };