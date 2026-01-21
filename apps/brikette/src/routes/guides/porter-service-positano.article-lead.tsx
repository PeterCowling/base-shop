import type { ReactNode } from "react";

import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import TagChips from "@/components/guides/TagChips";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { GUIDE_KEY } from "./porter-service-positano.constants";
import { PorterServiceStructuredDataPreview } from "./porter-service-positano.service-data";
import type { GuideExtras } from "./porter-service-positano.types";
import { renderGuideLinkTokens } from "./utils/linkTokens";

function renderResourceItem(
  resource: string,
  resourceIndex: number,
  resourceLinks: GuideExtras["resourceLinks"],
  context: GuideSeoTemplateContext,
): ReactNode[] {
  if (resourceLinks.length === 0) {
    return renderGuideLinkTokens(resource, context.lang, `resource-${resourceIndex}`);
  }

  return resourceLinks.reduce<ReactNode[]>(
    (nodes, link, linkIndex) =>
      nodes.flatMap((node) => {
        if (typeof node !== "string") return [node];
        if (!node.includes(link.label)) return [node];
        const segments = node.split(link.label);
        return segments.flatMap((segment, segmentIndex) => {
          const parts: (string | JSX.Element)[] = [];
          if (segment.length > 0) {
            parts.push(segment);
          }
          if (segmentIndex < segments.length - 1) {
            parts.push(
              <a
                key={`resource-${resourceIndex}-${linkIndex}-${segmentIndex}`}
                className="ms-1 inline-flex min-h-11 min-w-11 items-center underline"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>,
            );
          }
          return parts;
        });
      }),
    [resource],
  );
}

export function createArticleLead(
  buildGuideExtras: (context: GuideSeoTemplateContext) => GuideExtras,
): (context: GuideSeoTemplateContext) => JSX.Element {
  const PorterServiceArticleLead = (context: GuideSeoTemplateContext): JSX.Element => {
    const extras = buildGuideExtras(context);
    const {
      introTitle,
      intro,
      sections,
      steps,
      howTitle,
      resources,
      resourcesTitle,
      resourceLinks,
      etiquette,
      etiquetteTitle,
      faqs,
      faqsTitle,
      tocItems,
      tocTitle,
      galleryItems,
      galleryTitle,
      heroImage,
    } = extras;

    return (
      <>
        {intro.length > 0 ? (
          <section id="intro" aria-labelledby={`${GUIDE_KEY}-intro-heading`}>
            <h2 id={`${GUIDE_KEY}-intro-heading`} className="sr-only">
              {introTitle}
            </h2>
            {intro.map((paragraph, index) => (
              <p key={index}>
                {renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}
              </p>
            ))}
          </section>
        ) : null}

        {tocItems.length > 0 ? (
          <TableOfContents
            items={tocItems}
            {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
          />
        ) : null}

        <ImageGallery
          items={[
            {
              src: heroImage.src,
              alt: heroImage.alt,
              ...(typeof heroImage.width === "number" ? { width: heroImage.width } : {}),
              ...(typeof heroImage.height === "number" ? { height: heroImage.height } : {}),
            },
            ...galleryItems,
          ]}
          className="mb-8"
        />

        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}</p>
            ))}
          </section>
        ))}

        {steps.length > 0 ? (
          <section id="how">
            <h2>{howTitle}</h2>
            <ol>
              {steps.map((step, index) => (
                <li key={index}>{renderGuideLinkTokens(step, context.lang, `how-${index}`)}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {resources.length > 0 ? (
          <section id="resources">
            <h2>{resourcesTitle}</h2>
            <ul>
              {resources.map((resource, index) => (
                <li key={index}>{renderResourceItem(resource, index, resourceLinks, context)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {etiquette.length > 0 ? (
          <section id="etiquette">
            <h2>{etiquetteTitle}</h2>
            <ul>
              {etiquette.map((tip, index) => (
                <li key={index}>{renderGuideLinkTokens(tip, context.lang, `etiquette-${index}`)}</li>
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
                  <p key={answerIndex}>{renderGuideLinkTokens(answer, context.lang, `faq-${index}-${answerIndex}`)}</p>
                ))}
              </details>
            ))}
          </section>
        ) : null}

        {galleryItems.length > 0 ? (
          <section id="gallery">
            <h2>{galleryTitle}</h2>
            <ImageGallery items={galleryItems} />
          </section>
        ) : null}

        <TagChips />
      </>
    );
  };

  PorterServiceArticleLead.displayName = "PorterServiceArticleLead";

  return PorterServiceArticleLead;
}

export default function PorterServiceArticleLeadPreview(): JSX.Element {
  return <PorterServiceStructuredDataPreview />;
}

PorterServiceArticleLeadPreview.displayName = "PorterServiceArticleLeadPreview";
