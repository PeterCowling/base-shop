// apps/brikette/src/components/guides/generic-content/FaqSection.tsx
// Reusable FAQ section component for guide content

import { createElement, type ReactNode } from "react";

import type { FAQ } from "./types";

type FaqSectionProps = {
  faqs: FAQ[];
  title: string;
  headingLevel?: 2 | 3;
  isTitleSuppressed?: boolean;
  renderTokens: (value: string, key: string) => ReactNode;
  guideKey: string;
};

const FAQ_HEADING_CLASS = [
  "text-pretty",
  "text-2xl",
  "font-semibold",
  "leading-snug",
  "tracking-tight",
  "text-brand-heading",
  "sm:text-3xl",
].join(" ");

export function FaqSection({
  faqs,
  title,
  headingLevel = 2,
  isTitleSuppressed = false,
  renderTokens,
  guideKey,
}: FaqSectionProps): JSX.Element | null {
  if (faqs.length === 0) {
    return null;
  }

  const HeadingTag: "h2" | "h3" = headingLevel === 3 ? "h3" : "h2";
  const showHeading = !isTitleSuppressed && title.length > 0;

  return (
    <section id="faqs" className="scroll-mt-28 space-y-4">
      {showHeading
        ? createElement(
            HeadingTag,
            {
              id: "faqs",
              className: FAQ_HEADING_CLASS,
            },
            title
          )
        : null}
      <div className="space-y-4">
        {faqs.map((item, index) => (
          <details
            key={index}
            className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
          >
            <summary className="px-4 py-3 text-lg font-semibold leading-snug text-brand-heading sm:text-xl">
              {renderTokens(item.q, `${guideKey}-faq-${index}-question`)}
            </summary>
            {Array.isArray(item.a) ? (
              <div className="space-y-3 px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                {item.a.map((answer, answerIndex) => (
                  <p key={answerIndex}>
                    {renderTokens(answer, `${guideKey}-faq-${index}-answer-${answerIndex}`)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                {renderTokens(item.a, `${guideKey}-faq-${index}-answer`)}
              </p>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
