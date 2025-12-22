import TableOfContents from "@/components/guides/TableOfContents";

import { renderGuideLinkTokens, stripGuideLinkTokens } from "./utils/linkTokens";
import { buildGuideExtras } from "./how-to-reach-positano-on-a-budget.extras";
import type {
  GuideExtras,
  GuideSeoTemplateContext,
  HowToStepDetail,
} from "./how-to-reach-positano-on-a-budget.types";

export function renderArticleLead(
  context: GuideSeoTemplateContext,
  buildExtras: (context: GuideSeoTemplateContext) => GuideExtras = buildGuideExtras,
): JSX.Element {
  const extras = buildExtras(context);
  const { intro, sections, sectionIds, toc, map, steps, stepsHeading, alternatives, costs, tips, ferryCta } = extras;

  const renderStepContent = (step: HowToStepDetail, index: number) => {
    const nodes = renderGuideLinkTokens(step.name, context.lang, `step-${index}-name`);
    if (!step.text) {
      return nodes;
    }
    const textNodes = renderGuideLinkTokens(step.text, context.lang, `step-${index}-text`);
    return [
      ...nodes,
      step.name.length > 0 ? ": " : "",
      ...textNodes,
    ];
  };

  return (
    <>
      {intro.map((paragraph, index) => (
        <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
      ))}

      {toc.length > 0 ? <TableOfContents items={toc} /> : null}

      {sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
          ))}
        </section>
      ))}

      <section id={sectionIds.map}>
        <h2>{map.heading}</h2>
        <p>{context.article.description}</p>
        <div className="not-prose my-4 overflow-hidden rounded-lg border border-brand-outline/40">
          <div className="aspect-video">
            <iframe
              title={map.iframeTitle}
              loading="lazy"
              referrerPolicy={map.referrerPolicy}
              className="size-full border-0"
              src={map.url}
              data-aspect="16/9"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {steps.length > 0 ? (
        <section id={sectionIds.steps}>
          <h2>{stepsHeading}</h2>
          <ol>
            {steps.map((step, index) => (
              <li key={index}>{renderStepContent(step, index)}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {(alternatives.train.length > 0 || alternatives.ferry.length > 0) ? (
        <section id={sectionIds.alternatives}>
          <h2>{alternatives.heading}</h2>
          {alternatives.train.length > 0 ? (
            <>
              <h3>{alternatives.trainHeading}</h3>
              <ul>
                {alternatives.train.map((item, index) => {
                  const stripped = stripGuideLinkTokens(item);
                  const hasTokens = stripped !== item;
                  return (
                    <li key={index}>
                      {hasTokens ? (
                        <span className="sr-only">
                          {stripped}
                        </span>
                      ) : null}
                      {renderGuideLinkTokens(item, context.lang, `train-${index}`)}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          {alternatives.ferry.length > 0 ? (
            <>
              <h3>{alternatives.ferryHeading}</h3>
              <ul>
                {alternatives.ferry.map((item, index) => {
                  const stripped = stripGuideLinkTokens(item);
                  const hasTokens = stripped !== item;
                  return (
                    <li key={index}>
                      {hasTokens ? (
                        <span className="sr-only">
                          {stripped}
                        </span>
                      ) : null}
                      {renderGuideLinkTokens(item, context.lang, `ferry-${index}`)}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {costs.items.length > 0 ? (
        <section id={sectionIds.costs}>
          <h2>{costs.heading}</h2>
          <ul>
            {costs.items.map((item, index) => (
              <li key={index}>{renderGuideLinkTokens(item, context.lang, `cost-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {tips.items.length > 0 ? (
        <section id={sectionIds.tips}>
          <h2>{tips.heading}</h2>
          <ul>
            {tips.items.map((tip, index) => (
              <li key={index}>{renderGuideLinkTokens(tip, context.lang, `tip-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {ferryCta ? (
        <p>
          {stripGuideLinkTokens(ferryCta) !== ferryCta ? (
            <span className="sr-only">
              {stripGuideLinkTokens(ferryCta)}
            </span>
          ) : null}
          {renderGuideLinkTokens(ferryCta, context.lang, "ferry-cta")}
        </p>
      ) : null}
    </>
  );
}
