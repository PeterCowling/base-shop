 
// src/routes/guides/positano-on-a-backpacker-budget/_createArticleLead.tsx
import { Fragment } from "react";
import { Link } from "react-router-dom";

import TableOfContents from "@/components/guides/TableOfContents";
import GenericContent from "@/components/guides/GenericContent";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { renderGuideLinkTokens } from "../utils/linkTokens";
import { GUIDE_KEY, SECTION_IDS } from "./constants";
import type { GuideExtras } from "./types";
import { getGuidesTranslator } from "./translations";

export function createArticleLead(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
): JSX.Element {
  const extras = buildExtras(context);

  if (!extras.hasStructured) {
    return <GenericContent t={context.translator} guideKey={GUIDE_KEY} />;
  }

  const transportExtras = extras.transport;
  const guidesTranslator = getGuidesTranslator(context.lang);
  const guidesFallback = getGuidesTranslator("en");
  const resolveLinkLabel = (key: GuideKey) =>
    getGuideLinkLabel(guidesTranslator, guidesFallback, key) || key;

  return (
    <>
      {extras.intro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {extras.toc.length > 0 ? <TableOfContents items={extras.toc} /> : null}

      {extras.days.map((day) => (
        <section key={day.id} id={day.id}>
          <h2>{day.title}</h2>
          <ul>
            {day.items.map((item, index) => (
              <li key={index}>{renderGuideLinkTokens(item, context.lang, `day-${day.id}-${index}`)}</li>
            ))}
          </ul>
        </section>
      ))}

      {extras.savings.title && extras.savings.items.length > 0 ? (
        <section id={SECTION_IDS.savings}>
          <h2>{extras.savings.title}</h2>
          <ul>
            {extras.savings.items.map((item, index) => (
              <li key={index}>{renderGuideLinkTokens(item, context.lang, `saving-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {extras.food.title ? (
        <section id={SECTION_IDS.food}>
          <h2>{extras.food.title}</h2>
          {extras.food.text ? (
            <p>{renderGuideLinkTokens(extras.food.text, context.lang, "food-text")}</p>
          ) : null}
        </section>
      ) : null}

      {transportExtras ? (
        <section id={SECTION_IDS.transport}>
          <h2>{transportExtras.title}</h2>
          <ul>
            {transportExtras.compareLabel || transportExtras.compareLinks.length > 0 ? (
              <li>
                {transportExtras.compareLabel ? `${transportExtras.compareLabel} ` : null}
                {transportExtras.compareLinks.map(({ key, label }, index) => (
                  <Fragment key={`${key}-${index}`}>
                    <Link to={guideHref(context.lang, key)}>
                      {label && label.length > 0 ? label : resolveLinkLabel(key)}
                    </Link>
                    {index < transportExtras.compareLinks.length - 1 ? ", " : null}
                  </Fragment>
                ))}
              </li>
            ) : null}
            {transportExtras.ferryPrefix || transportExtras.ferryLinkLabel || transportExtras.ferrySuffix ? (
              <li>
                {transportExtras.ferryPrefix}
                <Link to={guideHref(context.lang, "ferrySchedules")}>
                  {transportExtras.ferryLinkLabel || resolveLinkLabel("ferrySchedules")}
                </Link>
                {transportExtras.ferrySuffix}
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {extras.faqs.length > 0 ? (
        <section id="faqs">
          <h2>{extras.faqsTitle || "FAQs"}</h2>
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
