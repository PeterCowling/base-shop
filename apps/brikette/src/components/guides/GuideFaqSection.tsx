// src/components/guides/GuideFaqSection.tsx
import { Section } from "@acme/design-system/atoms";

export type GuideFaq = {
  question: string;
  answers: string[];
};

export type GuideFaqSectionProps = {
  title: string;
  faqs: GuideFaq[];
  headingId?: string;
};

export function GuideFaqSection({ title, faqs, headingId = "faqs" }: GuideFaqSectionProps) {
  if (faqs.length === 0) {
    return null;
  }

  const normalizedHeadingId = headingId.trim() === "" ? undefined : headingId;

  return (
    <Section
      padding="none"
      className="mt-16 px-6 pb-12 sm:mt-20 sm:px-8 lg:mt-24 lg:pb-20"
      aria-labelledby={normalizedHeadingId}
    >
      <Section as="div" padding="none" width="full" className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/80 dark:text-brand-heading">
          <h2
            id={normalizedHeadingId}
            className="text-2xl font-semibold text-brand-heading dark:text-brand-heading"
          >
            {title}
          </h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => {
              const key = `${faq.question}-${faq.answers.join("|")}`;

              return (
                <details
                  key={key}
                  className="group rounded-2xl border border-brand-outline/20 bg-brand-surface/40 p-4 text-brand-text dark:border-brand-outline/30 dark:bg-brand-surface/40 dark:text-brand-heading/90"
                >
                  <summary className="cursor-pointer text-base font-medium outline-none transition group-open:text-brand-primary dark:text-brand-heading/90 dark:group-open:text-brand-secondary">
                    {faq.question}
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-brand-text/80 dark:text-brand-heading/80">
                    {faq.answers.map((answer, index) => (
                      <p key={`${faq.question}-${index}`}>{answer}</p>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </Section>
    </Section>
  );
}

export default GuideFaqSection;
