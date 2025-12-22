/* src/routes/experiences/components/CtaSection.tsx */
import { PrimaryLinkButton, SecondaryLinkButton } from "@/components/ui/cta";
import { Cluster } from "@/components/ui/flex";
import { CTA_HEADING_ID } from "../constants";
import { Section } from "@acme/ui/atoms/Section";
import type { CtaContent, CtaLink } from "../types";

type CtaSectionProps = {
  cta: CtaContent;
  ctaLinks: {
    book: CtaLink;
    events: CtaLink;
    breakfast: CtaLink;
    concierge: CtaLink;
  };
};

export function CtaSection({ cta, ctaLinks }: CtaSectionProps) {
  const ctaItems: Array<{
    key: keyof CtaSectionProps["ctaLinks"];
    label: string;
    to: string;
    variant: "primary" | "secondary";
  }> = [
    { key: "book", label: ctaLinks.book.label, to: ctaLinks.book.to, variant: "primary" },
    { key: "events", label: ctaLinks.events.label, to: ctaLinks.events.to, variant: "secondary" },
    { key: "breakfast", label: ctaLinks.breakfast.label, to: ctaLinks.breakfast.to, variant: "secondary" },
    { key: "concierge", label: ctaLinks.concierge.label, to: ctaLinks.concierge.to, variant: "secondary" },
  ];

  return (
    <Section padding="none" className="px-6 pb-24 sm:px-8" aria-labelledby={CTA_HEADING_ID}>
      <Section
        as="div"
        padding="none"
        width="full"
        className="mx-auto max-w-5xl"
      >
        <div className="rounded-3xl bg-brand-surface p-8 text-brand-heading shadow-lg sm:p-12 dark:bg-gradient-to-br dark:from-brand-primary dark:via-brand-primary dark:to-brand-bougainvillea dark:text-brand-heading">
          <h2
            id={CTA_HEADING_ID}
            className="text-3xl font-semibold leading-tight sm:text-4xl dark:text-brand-heading"
          >
            {cta.title}
          </h2>
          <Section
            as="div"
            padding="none"
            width="full"
            className="mt-4 max-w-3xl"
          >
            <p className="text-base text-brand-text/80 sm:text-lg dark:text-brand-heading/80">
              {cta.subtitle}
            </p>
          </Section>
          <Cluster className="mt-8 gap-3">
            {ctaItems.map(({ key, label, to, variant }) => {
              const ButtonComponent = variant === "primary" ? PrimaryLinkButton : SecondaryLinkButton;

              return (
                <ButtonComponent key={`${key}-${to}`} to={to}>
                  {label}
                </ButtonComponent>
              );
            })}
          </Cluster>
        </div>
      </Section>
    </Section>
  );
}
