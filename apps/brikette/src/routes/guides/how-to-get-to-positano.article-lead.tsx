// src/routes/guides/how-to-get-to-positano.article-lead.tsx
import { Section as UiSection } from "@acme/ui/atoms/Section";

import TableOfContents from "@/components/guides/TableOfContents";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { HowToGetToPositanoStructuredDataPreview } from "./how-to-get-to-positano.additional-scripts";
import type { GuideExtras } from "./how-to-get-to-positano.types";
import { renderGuideLinkTokens } from "./utils/linkTokens";

export function renderArticleLead(
  context: GuideSeoTemplateContext,
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras,
): JSX.Element {
  const { intro, sections, toc, when, cheapest, seasonal } = buildExtras(context);

  return (
    <UiSection as="div" padding="none" width="full">
      {intro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {toc.length > 0 ? <TableOfContents items={toc} /> : null}

      {sections.length > 0 ? (
        sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
            ))}
          </section>
        ))
      ) : (
        <>
          {when.items.length > 0 ? (
            <section id="when">
              <h2>{when.heading}</h2>
              <ul>
                {when.items.map((item, index) => (
                  <li key={index}>
                    {item.label ? <strong>{item.label}</strong> : null}
                    {item.label && item.body ? " — " : null}
                    {item.body ? renderGuideLinkTokens(item.body, context.lang, `when-${index}`) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {cheapest.steps.length > 0 ? (
            <section id="cheapest">
              <h2>{cheapest.heading}</h2>
              <ol>
                {cheapest.steps.map((step, index) => (
                  <li key={index}>{renderGuideLinkTokens(step, context.lang, `cheapest-${index}`)}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {seasonal.points.length > 0 ? (
            <section id="seasonal">
              <h2>{seasonal.heading}</h2>
              <ul>
                {seasonal.points.map((point, index) => (
                  <li key={index}>{renderGuideLinkTokens(point, context.lang, `seasonal-${index}`)}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </UiSection>
  );
}

export default function HowToGetToPositanoArticleLeadPreview(): JSX.Element {
  return <HowToGetToPositanoStructuredDataPreview />;
}
