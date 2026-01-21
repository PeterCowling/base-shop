import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

import TableOfContents from "@/components/guides/TableOfContents";
import { CfImage } from "@/components/images/CfImage";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

import { createGuideLabelReader } from "./labels";
import type { GuideExtras } from "./types";

const inlineLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

const GUIDE_SCHEME_PREFIX = "guide:" as const;

function renderInlineLinks(
  value: string,
  keyPrefix: string,
  context: GuideSeoTemplateContext,
): ReactNode {
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
        parts.push(
          <Fragment key={key}>
            {label}
          </Fragment>,
        );
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
}

export function renderArticleLead(
  context: GuideSeoTemplateContext,
  extras: GuideExtras,
): JSX.Element {
  const {
    intro,
    sections,
    tocItems,
    tocTitle,
    beforeList,
    stepsList,
    kneesList,
    kneesDockPrefix,
    kneesDockLinkText,
    kneesPorterPrefix,
    kneesPorterLinkText,
    faqs,
    faqsTitle,
    labels,
  } = extras;

  const readLabel = createGuideLabelReader(context, labels);

  const shouldRenderKnees =
    kneesList.length > 0 ||
    (kneesDockPrefix && kneesDockLinkText) ||
    (kneesPorterPrefix && kneesPorterLinkText);

  return (
    <div className="space-y-12">
      {intro.length > 0 ? (
        <div className="space-y-4">
          {intro.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {renderInlineLinks(paragraph, `intro-${index}`, context)}
            </p>
          ))}
        </div>
      ) : null}

      {tocItems.length > 0 && !context.hasLocalizedContent ? (
        <TableOfContents className="mt-6" title={tocTitle} items={tocItems} />
      ) : null}

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-5">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">{section.title}</h2>
          <div className="space-y-4">
            {section.body.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {renderInlineLinks(paragraph, `${section.id}-body-${index}`, context)}
              </p>
            ))}
          </div>
          {Array.isArray(section.figures) && section.figures.length > 0 ? (
            <div className={section.figures.length > 1 ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
              {section.figures.map((figure, index) => (
                <figure
                  key={`${section.id}-figure-${index}`}
                  className="overflow-hidden rounded-2xl border border-brand-outline/20 shadow-sm"
                >
                  <CfImage
                    src={figure.src}
                    preset="gallery"
                    alt={figure.alt}
                    className="size-full object-cover"
                  />
                  {figure.caption ? (
                    <figcaption className="bg-brand-surface px-4 py-3 text-sm text-brand-text/70 dark:bg-brand-surface/70 dark:text-brand-surface/80">
                      {figure.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      {beforeList.length > 0 ? (
        <section id="before" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.before") ?? labels.before}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {beforeList.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {renderInlineLinks(item, `before-${index}`, context)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stepsList.length > 0 ? (
        <section id="steps" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.steps") ?? labels.steps}
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {stepsList.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {renderInlineLinks(item, `steps-${index}`, context)}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {shouldRenderKnees ? (
        <section id="knees" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.knees") ?? labels.knees}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {kneesList.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {renderInlineLinks(item, `knees-${index}`, context)}
              </li>
            ))}
            {kneesDockPrefix && kneesDockLinkText ? (
              <li className="leading-relaxed">
                {kneesDockPrefix}{" "}
                <Link
                  to={guideHref(context.lang, "chiesaNuovaArrivals")}
                  className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
                >
                  {kneesDockLinkText}
                </Link>
                .
              </li>
            ) : null}
            {kneesPorterPrefix && kneesPorterLinkText ? (
              <li className="leading-relaxed">
                {kneesPorterPrefix}{" "}
                <Link
                  to={guideHref(context.lang, "porterServices")}
                  className="inline-flex min-h-11 min-w-11 items-center align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
                >
                  {kneesPorterLinkText}
                </Link>
                .
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section id="faqs" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">{faqsTitle}</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="rounded-lg border border-brand-outline/20 bg-brand-surface/80 p-4 shadow-sm transition hover:border-brand-primary/40 dark:border-brand-outline/40 dark:bg-brand-surface/30"
              >
                <summary className="cursor-pointer text-base font-semibold text-brand-heading outline-none transition focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 dark:text-brand-surface">
                  {faq.q}
                </summary>
                <div className="mt-3 space-y-3">
                  {faq.a.map((answer, answerIndex) => (
                    <p key={answerIndex} className="leading-relaxed">
                      {renderInlineLinks(answer, `faq-${index}-${answerIndex}`, context)}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
