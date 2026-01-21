import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { SectionHeading } from "@/components/guides/generic-content/SectionHeading";
import ImageGallery from "@/components/guides/ImageGallery";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import type { PathOfTheGodsGuideExtras } from "./path-of-the-gods.extras";

const inlineLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const GUIDE_SCHEME_PREFIX = /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Internal URI scheme */ "guide:" as const;

const BODY_TEXT_CLASS =
  /* i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout-only typography tokens */ "text-base leading-relaxed text-brand-text/90 dark:text-brand-surface/90 sm:text-lg";

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

const renderInlineLinks = (
  value: string,
  keyPrefix: string,
  context: GuideSeoTemplateContext,
): ReactNode => {
  inlineLinkPattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const parts: ReactNode[] = [];

  while ((match = inlineLinkPattern.exec(value))) {
    if (match.index > lastIndex) {
      const textSegment = value.slice(lastIndex, match.index);
      if (textSegment) {
        parts.push(<Fragment key={`${keyPrefix}-text-${match.index}`}>{textSegment}</Fragment>);
      }
    }

    const labelRaw = match[1];
    const hrefRaw = match[2];
    if (!labelRaw || !hrefRaw) {
      lastIndex = inlineLinkPattern.lastIndex;
      continue;
    }
    const label = labelRaw.trim();
    const href = hrefRaw.trim();
    const key = `${keyPrefix}-link-${match.index}`;

    if (href.startsWith(GUIDE_SCHEME_PREFIX)) {
      const guideKey = href.slice(GUIDE_SCHEME_PREFIX.length).trim();
      if (guideKey.length > 0) {
        parts.push(
          <Link
            key={key}
            to={guideHref(context.lang, guideKey as GuideKey)}
            prefetch="intent"
            className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
          >
            {label}
          </Link>,
        );
      } else {
        parts.push(<Fragment key={key}>{label}</Fragment>);
      }
    } else if (href.startsWith("/")) {
      parts.push(
        <Link
          key={key}
          to={href}
          prefetch="intent"
          className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
        >
          {label}
        </Link>,
      );
    } else {
      parts.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
        >
          {label}
        </a>,
      );
    }

    lastIndex = inlineLinkPattern.lastIndex;
  }

  if (lastIndex < value.length) {
    const textSegment = value.slice(lastIndex);
    if (textSegment) {
      parts.push(<Fragment key={`${keyPrefix}-text-${lastIndex}`}>{textSegment}</Fragment>);
    }
  }

  return parts.length > 0 ? parts : value;
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
    } = extras;
    const fallbackTipsHeading = readLabel(context.translateGuides, "labels.tipsHeading");
    const fallbackFaqsHeading = readLabel(context.translateGuides, "labels.faqsHeading");

    return (
      <>
        {intro.length > 0 ? (
          <div className="space-y-4">
            {intro.map((paragraph, index) => (
              <p key={index} className={BODY_TEXT_CLASS}>
                {renderInlineLinks(paragraph, `intro-${index}`, context)}
              </p>
            ))}
          </div>
        ) : null}
        {essentials.length > 0 ? (
          <section id="essentials" className="scroll-mt-28 space-y-4">
            <SectionHeading>{essentialsTitle}</SectionHeading>
            <ul>
              {essentials.map((item, index) => (
                <li key={index}>{renderInlineLinks(item, `essentials-${index}`, context)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {costs.length > 0 ? (
          <section id="costs" className="scroll-mt-28 space-y-4">
            <SectionHeading>{costsTitle}</SectionHeading>
            <ul>
              {costs.map((item, index) => (
                <li key={index}>{renderInlineLinks(item, `costs-${index}`, context)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
            <SectionHeading>{section.title}</SectionHeading>
            <div className="space-y-4">
              {section.body.map((paragraph, index) => (
                <p key={index} className={BODY_TEXT_CLASS}>
                  {renderInlineLinks(paragraph, `${section.id}-body-${index}`, context)}
                </p>
              ))}
            </div>
          </section>
        ))}

        {tips.length > 0 ? (
          <section id="tips" className="scroll-mt-28 space-y-4">
            <SectionHeading>{tipsTitle || fallbackTipsHeading}</SectionHeading>
            <ul>
              {tips.map((tip, index) => (
                <li key={index}>{renderInlineLinks(tip, `tips-${index}`, context)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {context.faqs.length > 0 ? (
          <section id="faqs" className="scroll-mt-28 space-y-4">
            <SectionHeading>{faqsTitle || fallbackFaqsHeading}</SectionHeading>
            {context.faqs.map((faq, index) => (
              <details key={index}>
                <summary className={BODY_TEXT_CLASS}>
                  {renderInlineLinks(faq.q, `faq-${index}-q`, context)}
                </summary>
                {faq.a.map((answer, answerIndex) => (
                  <p key={answerIndex} className={BODY_TEXT_CLASS}>
                    {renderInlineLinks(answer, `faq-${index}-a-${answerIndex}`, context)}
                  </p>
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
