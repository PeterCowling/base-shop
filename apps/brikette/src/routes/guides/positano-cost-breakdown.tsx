// src/routes/guides/positano-cost-breakdown.tsx
import { memo, useCallback } from "react";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { renderGuideLinkTokens } from "./utils/linkTokens";
import type { GuideSeoTemplateProps } from "./guide-seo/types";

import TableOfContents from "@/components/guides/TableOfContents";
import CostBreakdown from "@/components/guides/CostBreakdown";
import GenericContent from "@/components/guides/GenericContent";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";

import {
  GUIDE_KEY as GUIDE_KEY_CONST,
  GUIDE_SLUG as GUIDE_SLUG_CONST,
  OG_IMAGE,
} from "./positano-cost-breakdown/constants";
import { buildGuideExtras } from "./positano-cost-breakdown/extras";
import { buildGuideFaqFallback } from "./positano-cost-breakdown/guideFaqFallback";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
export { handle } from "./positano-cost-breakdown/constants";
// Required identifiers for lint/template enforcement
export const GUIDE_KEY: GuideKey = GUIDE_KEY_CONST;
export const GUIDE_SLUG = GUIDE_SLUG_CONST;

function renderStructuredContent(
  extras: ReturnType<typeof buildGuideExtras>,
  context: GuideSeoTemplateContext
): JSX.Element {
  return (
    <>
      {extras.intro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {extras.tocItems.length > 0 ? (
        <TableOfContents
          items={extras.tocItems}
          {...(typeof extras.tocTitle === "string" ? { title: extras.tocTitle } : {})}
        />
      ) : null}

      <section id="at-a-glance">
        <h2>{extras.atAGlanceLabel}</h2>
        <CostBreakdown items={extras.costItems} currency="EUR" lang={context.lang} title={extras.costTitle} />
      </section>

      {extras.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
          ))}
        </section>
      ))}

      {extras.tips.length > 0 ? (
        <aside id="tips">
          {extras.tipsTitle ? <h2>{extras.tipsTitle}</h2> : null}
          <ul>
            {extras.tips.map((tip, index) => (
              <li key={index}>{renderGuideLinkTokens(tip, context.lang, `tip-${index}`)}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      {extras.faqs.length > 0 ? (
        <section id="faqs">
          {extras.faqsTitle ? <h2>{extras.faqsTitle}</h2> : null}
          {extras.faqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, answerIndex) => (
                <p key={answerIndex}>
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

function PositanoCostBreakdown(): JSX.Element {
  const buildExtras = useCallback(buildGuideExtras, []);

  const articleLead = useCallback(
    (context: GuideSeoTemplateContext) => {
      const extras = buildExtras(context);

      if (!extras.hasStructured) {
        return <GenericContent t={context.translator} guideKey={GUIDE_KEY} />;
      }

      return renderStructuredContent(extras, context);
    },
    [buildExtras],
  );

  const buildTocItems = useCallback(
    (context: GuideSeoTemplateContext) => buildExtras(context).tocItems,
    [buildExtras],
  );

  const guideFaqFallback = useCallback<
    NonNullable<GuideSeoTemplateProps["guideFaqFallback"]>
  >((targetLang) => {
    const faqs = buildGuideFaqFallback(targetLang);
    if (!Array.isArray(faqs) || faqs.length === 0) {
      return undefined;
    }
    return faqs
      .map(({ q, a }) => ({
        question: q.trim(),
        answer: a.map((answer) => answer.trim()).filter((answer) => answer.length > 0),
      }))
      .filter((entry): entry is NormalizedFaqEntry => entry.question.length > 0 && entry.answer.length > 0);
  }, []);

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      ogImage={OG_IMAGE}
      articleLead={articleLead}
      buildTocItems={buildTocItems}
      guideFaqFallback={guideFaqFallback}
      renderGenericContent={false}
      relatedGuides={{ items: [{ key: "positanoBudget" }, { key: "cheapEats" }, { key: "transportBudget" }] }}
    />
  );
}

export default memo(PositanoCostBreakdown);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, GUIDE_KEY, {
    en: () => import("../../locales/en/guides/content/positanoCostBreakdown.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/positanoCostBreakdown.json`).catch(() => undefined),
  });
  return { lang } as const;
}

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(OG_IMAGE.path, {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: OG_IMAGE.transform.quality,
    format: OG_IMAGE.transform.format,
  });
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

export const links: LinksFunction = (
  ..._linkArgs: Parameters<LinksFunction>
) => buildRouteLinks();
