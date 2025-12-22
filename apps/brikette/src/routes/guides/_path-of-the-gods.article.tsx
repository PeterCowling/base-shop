import TableOfContents from "@/components/guides/TableOfContents";
import ImageGallery from "@/components/guides/ImageGallery";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { PathOfTheGodsGuideExtras } from "./path-of-the-gods.extras";

const readLabel = (translate: GuideSeoTemplateContext["translateGuides"], key: string): string => {
  const value = translate(key);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed !== key) {
      return trimmed;
    }
  }
  return "";
};

export const createPathOfTheGodsArticleLead = (
  buildGuideExtras: (context: GuideSeoTemplateContext) => PathOfTheGodsGuideExtras,
) => {
  const PathOfTheGodsArticleLead = (context: GuideSeoTemplateContext) => {
    const extras = buildGuideExtras(context);
    const {
      intro,
      essentials,
      essentialsTitle,
      costs,
      costsTitle,
      sections,
      tips,
      tipsTitle,
      faqsTitle,
      tocItems,
      tocTitle,
    } = extras;
    const fallbackTipsHeading = readLabel(context.translateGuides, "labels.tipsHeading");
    const fallbackFaqsHeading = readLabel(context.translateGuides, "labels.faqsHeading");

    return (
      <>
        {intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {tocItems.length > 0 ? <TableOfContents title={tocTitle} items={tocItems} /> : null}

        {essentials.length > 0 ? (
          <section id="essentials">
            <h2>{essentialsTitle}</h2>
            <ul>
              {essentials.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {costs.length > 0 ? (
          <section id="costs">
            <h2>{costsTitle}</h2>
            <ul>
              {costs.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ))}

        {tips.length > 0 ? (
          <section id="tips">
            <h2>{tipsTitle || fallbackTipsHeading}</h2>
            <ul>
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {context.faqs.length > 0 ? (
          <section id="faqs">
            <h2>{faqsTitle || fallbackFaqsHeading}</h2>
            {context.faqs.map((faq, index) => (
              <details key={index}>
                <summary>{faq.q}</summary>
                {faq.a.map((answer, answerIndex) => (
                  <p key={answerIndex}>{answer}</p>
                ))}
              </details>
            ))}
          </section>
        ) : null}
      </>
    );
  };

  PathOfTheGodsArticleLead.displayName = "PathOfTheGodsArticleLead";

  return PathOfTheGodsArticleLead;
};

export const createPathOfTheGodsArticleExtras = (
  buildGuideExtras: (context: GuideSeoTemplateContext) => Pick<PathOfTheGodsGuideExtras, "galleryItems" | "galleryTitle">,
) => {
  const PathOfTheGodsArticleExtras = (context: GuideSeoTemplateContext) => {
    const { galleryItems, galleryTitle } = buildGuideExtras(context);
    if (!galleryItems.length) return null;

    return (
      <section id="gallery">
        <h2>{galleryTitle}</h2>
        <ImageGallery items={galleryItems} />
      </section>
    );
  };

  PathOfTheGodsArticleExtras.displayName = "PathOfTheGodsArticleExtras";

  return PathOfTheGodsArticleExtras;
};
