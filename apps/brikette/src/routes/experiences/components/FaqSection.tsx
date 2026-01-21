/* src/routes/experiences/components/FaqSection.tsx */
import { Section } from "@acme/ui/atoms/Section";

import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

import { FAQ_HEADING_ID } from "../constants";

type FaqSectionProps = {
  title: string;
  entries: NormalizedFaqEntry[];
};

export function FaqSection({ title, entries }: FaqSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Section
      padding="none"
      className="mt-16 px-6 pb-12 sm:mt-20 sm:px-8 md:px-12 lg:mt-24 lg:px-16 lg:pb-20"
      aria-labelledby={FAQ_HEADING_ID}
    >
      <Section
        as="div"
        padding="none"
        width="full"
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/80 dark:text-brand-heading">
          <h2 id={FAQ_HEADING_ID} className="text-2xl font-semibold text-brand-heading dark:text-brand-heading">
            {title}
          </h2>
          <div className="mt-6 space-y-4">
            {entries.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-brand-outline/20 bg-brand-surface/40 p-4 text-brand-text dark:border-brand-outline/30 dark:bg-brand-surface/40 dark:text-brand-heading/90"
              >
                <summary className="cursor-pointer text-base font-medium outline-none transition group-open:text-brand-primary dark:text-brand-heading/90 dark:group-open:text-brand-secondary">
                  {item.question}
                </summary>
                <div className="mt-3 space-y-2 text-sm text-brand-text/80 dark:text-brand-heading/80">
                  {item.answer.map((paragraph, index) => (
                    <p key={`${item.question}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </Section>
  );
}
