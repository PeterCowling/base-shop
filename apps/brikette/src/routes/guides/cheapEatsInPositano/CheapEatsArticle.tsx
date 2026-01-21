// src/routes/guides/cheapEatsInPositano/CheapEatsArticle.tsx
import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { CfImage } from "@/components/images/CfImage";

import {
  type CheapEatsArticleData,
  FAQ_SECTION_ID,
  GALLERY_SECTION_ID,
  HERO_IMAGE_PATH,
  RECOMMENDATIONS_SECTION_ID,
} from "./constants";
import { getTableOfContentsItems } from "./getTableOfContentsItems";

export function CheapEatsArticle({
  title,
  heroAlt,
  hasStructured,
  structuredIntro,
  structuredSections,
  structuredFaqs,
  recommendations,
  recommendationsHeading,
  recommendationsTocLabel,
  fallbackWhereToEatLabel,
  faqHeading,
  faqTocLabel,
  fallbackFaqLabel,
  fallbackIntro,
  fallbackFaqs,
  galleryHeading,
  galleryItems,
  tocTitle,
}: CheapEatsArticleData) {
  const tocItems = hasStructured
    ? getTableOfContentsItems({
        sections: structuredSections,
        recommendations,
        faqs: structuredFaqs,
        recommendationsLabel: recommendationsTocLabel,
        faqLabel: faqTocLabel,
      })
    : [];

  const shouldShowToc = hasStructured && tocItems.length > 0;

  return (
    <article className="prose prose-slate dark:prose-invert">
      <header>
        <h1>{title}</h1>
      </header>

      {hasStructured ? (
        <>
          {structuredIntro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {shouldShowToc ? (
            <TableOfContents
              items={tocItems}
              {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
            />
          ) : null}
          <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={heroAlt} />
          {structuredSections.map((section) => (
            <section key={section.id || section.title} id={section.id || undefined}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
          {recommendations.length > 0 && (
            <section id={RECOMMENDATIONS_SECTION_ID}>
              <h2>{recommendationsHeading}</h2>
              <ul>
                {recommendations.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <strong>{item.name}</strong>
                    {item.note ? <span className="ms-1">— {item.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {structuredFaqs.length > 0 && (
            <section id={FAQ_SECTION_ID}>
              <h2>{faqHeading}</h2>
              {structuredFaqs.map((faq, index) => (
                <details key={index}>
                  <summary>{faq.q}</summary>
                  {faq.a.map((answer, idx) => (
                    <p key={idx}>{answer}</p>
                  ))}
                </details>
              ))}
            </section>
          )}
        </>
      ) : (
        <>
          <CfImage src={HERO_IMAGE_PATH} preset="hero" width={1200} height={630} alt={heroAlt} />
          <section id={RECOMMENDATIONS_SECTION_ID}>
            <h2>{fallbackWhereToEatLabel}</h2>
            <ul>
              {recommendations.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <strong>{item.name}</strong>
                  {item.note ? <span className="ms-1">— {item.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {!hasStructured
        ? fallbackIntro.map((paragraph, index) => <p key={`fallback-intro-${index}`}>{paragraph}</p>)
        : null}

      {!hasStructured && fallbackFaqs.length > 0 ? (
        <>
          <h2 id={FAQ_SECTION_ID}>{fallbackFaqLabel}</h2>
          {fallbackFaqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.q}</summary>
              {faq.a.map((answer, idx) => (
                <p key={idx}>{answer}</p>
              ))}
            </details>
          ))}
        </>
      ) : null}

      <section id={GALLERY_SECTION_ID}>
        <h2>{galleryHeading}</h2>
        <ImageGallery items={galleryItems} />
      </section>
    </article>
  );
}
