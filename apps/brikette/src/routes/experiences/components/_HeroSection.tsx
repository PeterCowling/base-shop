/* src/routes/experiences/components/_HeroSection.tsx */
import clsx from "clsx";

import { Section } from "@acme/ui/atoms/Section";

import { PrimaryLinkButton, SecondaryLinkButton } from "@/components/ui/cta";
import { Cluster, InlineItem, Stack } from "@/components/ui/flex";

import type { HeroContent, HeroCta, SectionContent } from "../types";

type HeroSectionProps = {
  hero: HeroContent;
  heroCtas: HeroCta[];
  sections: SectionContent[];
};

export function HeroSection({ hero, heroCtas, sections }: HeroSectionProps) {
  return (
    <Section
      width="full"
      padding="none"
      className={clsx(
        "relative",
        "overflow-hidden",
        "bg-brand-surface",
        "text-brand-heading",
        "dark:bg-gradient-to-br",
        "dark:from-brand-primary/90",
        "dark:via-brand-primary",
        "dark:to-brand-bougainvillea",
        "dark:text-brand-heading",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="absolute -top-32 end-0 size-72 rounded-full bg-brand-surface/60 blur-3xl dark:bg-brand-text/10"
          aria-hidden
        />
        <div
          className="absolute bottom-0 start-0 size-80 -translate-x-1/2 rounded-full bg-brand-secondary/30 blur-3xl"
          aria-hidden
        />
      </div>
      <Section
        as="div"
        padding="none"
        width="full"
        className="relative mx-auto max-w-5xl"
      >
        <Stack className="gap-8 px-6 py-16 sm:px-10 md:px-12 lg:flex-row lg:items-center lg:px-16 lg:py-24">
          <Stack className="flex-1 gap-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary/90">
              {hero.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl dark:text-brand-heading">
              {hero.title}
            </h1>
            <Section
              as="div"
              padding="none"
              width="full"
              className="mt-5 max-w-2xl"
            >
              <p className="text-base text-brand-text/80 sm:text-lg dark:text-brand-heading/85">
                {hero.description}
              </p>
            </Section>
            <Section
              as="div"
              padding="none"
              width="full"
              className="mt-4 max-w-2xl"
            >
              <p className="text-sm text-brand-text/70 dark:text-brand-heading/70">{hero.supporting}</p>
            </Section>
            <Cluster className="mt-8 gap-3">
              {heroCtas.map(({ label, aria, to }, index) => {
                const key = `${label}-${to}`;

                if (index === 0) {
                  return (
                    <PrimaryLinkButton key={key} to={to} ariaLabel={aria} tone="surface">
                      {label}
                    </PrimaryLinkButton>
                  );
                }

                return (
                  <SecondaryLinkButton key={key} to={to} ariaLabel={aria}>
                    {label}
                  </SecondaryLinkButton>
                );
              })}
            </Cluster>
          </Stack>
          <Stack className="flex-1 gap-4 rounded-3xl border border-brand-outline/20 bg-brand-surface/95 p-6 shadow-lg backdrop-blur dark:border-brand-heading/25 dark:bg-brand-surface/60">
            <ul className="space-y-4 text-sm text-brand-text/80 dark:text-brand-heading/90">
              {sections.map((section) => (
                <InlineItem key={section.key} className="gap-3">
                  <span
                    className="mt-1 inline-block size-2.5 flex-none rounded-full bg-brand-secondary"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold dark:text-brand-heading">{section.title}</p>
                    <p className="mt-1 text-brand-text/70 dark:text-brand-heading/85">{section.description}</p>
                  </div>
                </InlineItem>
              ))}
            </ul>
          </Stack>
        </Stack>
      </Section>
    </Section>
  );
}
