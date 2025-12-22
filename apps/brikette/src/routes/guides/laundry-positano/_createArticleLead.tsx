// src/routes/guides/laundry-positano/_createArticleLead.tsx
 
import TableOfContents from "@/components/guides/TableOfContents";
import ImageGallery from "@/components/guides/ImageGallery";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { renderGuideLinkTokens } from "../utils/linkTokens";

import type { GuideExtras } from "./types";

export function createArticleLead(
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
  context: GuideSeoTemplateContext,
): JSX.Element {
  const extras = buildExtras(context);
  const {
    intro,
    sections,
    howToSteps,
    howToTitle,
    tips,
    tipsTitle,
    faqs,
    faqsTitle,
    tocItems,
    tocTitle,
    galleryItems,
  } = extras;

  return (
    <>
      {intro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {tocItems.length > 0 ? <TableOfContents title={tocTitle} items={tocItems} /> : null}

      <ImageGallery items={galleryItems} className="mb-8" />

      {sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
          ))}
        </section>
      ))}

      {howToSteps.length > 0 ? (
        <section id="howto">
          <h2>{howToTitle}</h2>
          <ol>
            {howToSteps.map((step, index) => (
              <li key={index}>{renderGuideLinkTokens(step, context.lang, `howto-${index}`)}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {tips.length > 0 ? (
        <section id="tips">
          <h2>{tipsTitle}</h2>
          <ul>
            {tips.map((tip, index) => (
              <li key={index}>{renderGuideLinkTokens(tip, context.lang, `tips-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section id="faqs">
          <h2>{faqsTitle}</h2>
          {faqs.map((faq, index) => (
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
