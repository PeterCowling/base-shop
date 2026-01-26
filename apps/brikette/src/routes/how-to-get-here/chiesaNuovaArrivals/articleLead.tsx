import type { HTMLAttributeReferrerPolicy } from "react";
import Link from "next/link";

import TableOfContents from "@/components/guides/TableOfContents";
import { CfImage } from "@acme/ui/atoms/CfImage";
import { guideHref } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

import { createGuideLabelReader } from "./labels";
import type { GuideExtras } from "./types";

const MAP_REFERRER_POLICY: HTMLAttributeReferrerPolicy = "no-referrer-when-downgrade";

export function renderArticleLead(context: GuideSeoTemplateContext, extras: GuideExtras): JSX.Element {
  const {
    intro,
    image,
    sections,
    beforeList,
    stepsList,
    stepsMapEmbedUrl,
    kneesList,
    kneesDockPrefix,
    kneesDockLinkText,
    kneesPorterPrefix,
    kneesPorterLinkText,
    faqs,
    faqsTitle,
    tocItems,
    tocTitle,
    labels,
  } = extras;

  const readLabel = createGuideLabelReader(context, labels);

  const stepsHeading = readLabel("toc.steps") ?? labels.steps;

  const shouldRenderKnees =
    kneesList.length > 0 ||
    (kneesDockPrefix && kneesDockLinkText) ||
    (kneesPorterPrefix && kneesPorterLinkText);

  return (
    <div className="space-y-12">
      {intro.length > 0 || image ? (
        <div className="space-y-4">
          {intro.map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
          {image ? (
            <figure className="overflow-hidden rounded-2xl border border-brand-outline/20 shadow-sm">
              <CfImage
                src={image.src}
                preset="gallery"
                alt={image.alt}
                className="size-full object-cover"
                data-aspect="4/3"
              />
              {image.caption ? (
                <figcaption className="bg-brand-surface px-4 py-3 text-sm text-brand-text/70 dark:bg-brand-surface/70 dark:text-brand-text/80">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>
      ) : null}

      {/* Render a local Table of Contents when items are provided. */}
      {Array.isArray(tocItems) && tocItems.length > 0 ? (
        <TableOfContents title={tocTitle} items={tocItems} />
      ) : null}

      {sections.map((section) => {
        const isDuplicateOfGeneric =
          (context.renderGenericContent ?? true) &&
          Array.isArray(context.sections) &&
          context.sections.some((s) => s?.id === section.id);
        if (isDuplicateOfGeneric) return null;

        return (
          <section key={section.id} id={section.id} className="space-y-5">
            {(() => {
              const isStubAnchor = typeof section.id === "string" && section.id.endsWith("-stub");
              if (isStubAnchor) {
                // Provide an anchor target without creating a second visible H2.
                return (
                  <div aria-hidden="true" className="sr-only">
                    {section.title}
                  </div>
                );
              }
              return (
                <h2 className="text-pretty text-3xl font-semibold tracking-tight">{section.title}</h2>
              );
            })()}
            <div className="space-y-4">
              {section.body.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        );
      })}

      {beforeList.length > 0 ? (
        <section id="before" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {readLabel("toc.before") ?? labels.before}
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            {beforeList.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stepsList.length > 0 ? (
        <section id="steps" className="space-y-4">
          <h2 className="text-pretty text-3xl font-semibold tracking-tight">
            {stepsHeading}
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {stepsList.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
          {stepsMapEmbedUrl ? (
            <div className="not-prose w-full overflow-hidden rounded-xl border border-brand-outline/20 shadow-sm">
              <div className="aspect-video">
                <iframe
                  title={`${stepsHeading} map`}
                  src={stepsMapEmbedUrl}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy={MAP_REFERRER_POLICY}
                  className="size-full border-0"
                  data-aspect="16/9"
                />
              </div>
            </div>
          ) : null}
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
                {item}
              </li>
            ))}
            {kneesDockPrefix && kneesDockLinkText ? (
              <li className="leading-relaxed">
                {kneesDockPrefix}{" "}
                <Link
                  href={guideHref(context.lang, "ferryDockToBrikette")}
                  className="font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
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
                  href={guideHref(context.lang, "porterServices")}
                  className="font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
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
                <summary className="cursor-pointer text-base font-semibold text-brand-heading outline-none transition focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 dark:text-brand-text">
                  {faq.q}
                </summary>
                <div className="mt-3 space-y-3">
                  {faq.a.map((answer, answerIndex) => (
                    <p key={answerIndex} className="leading-relaxed">
                      {answer}
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
