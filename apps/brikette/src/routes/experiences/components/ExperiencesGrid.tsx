/* src/routes/experiences/components/ExperiencesGrid.tsx */
import clsx from "clsx";

import { Grid } from "@acme/ui/atoms/Grid";
import { Section } from "@acme/ui/atoms/Section";

import { CfImage } from "@/components/images/CfImage";
import { InlineItem, Stack } from "@/components/ui/flex";

import type { SectionContent } from "../types";

type ArticleProps = JSX.IntrinsicElements["article"];
const Card = ({ className, ...props }: ArticleProps) => (
  <article className={clsx("flex", "h-full", "flex-col", className)} {...props} />
);

type ExperiencesGridProps = {
  sections: SectionContent[];
};

export function ExperiencesGrid({ sections }: ExperiencesGridProps) {
  return (
    <Section padding="none" className="px-6 py-16 sm:px-8 md:px-12 lg:px-16 lg:py-24">
      <Section
        as="div"
        padding="none"
        width="full"
        className="mx-auto max-w-6xl"
      >
        <Grid className="gap-10 lg:grid-cols-3">
          {sections.map((section) => (
            <Card
              key={section.key}
              className="overflow-hidden rounded-3xl border border-brand-outline/30 bg-brand-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-brand-heading/15 dark:bg-brand-surface/70"
            >
              <CfImage
                src={section.imageRaw}
                preset="gallery"
                alt={section.imageAlt}
                className="h-56 w-full object-cover"
              />
              <Stack className="flex-1 gap-4 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-secondary dark:text-brand-secondary/80">
                  {section.eyebrow}
                </p>
                <h2 className="text-xl font-semibold text-brand-heading dark:text-brand-heading">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-brand-text/80 dark:text-brand-heading/85">
                  {section.description}
                </p>
                {section.highlights.length > 0 ? (
                  <Stack as="ul" className="mt-2 gap-2 text-sm text-brand-text/70 dark:text-brand-heading/80">
                    {section.highlights.map((item, index) => (
                      <InlineItem key={`${section.key}-${index}`} className="gap-2">
                        <span
                          className="mt-1 inline-block size-1.5 flex-none rounded-full bg-brand-secondary/80"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </InlineItem>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Card>
          ))}
        </Grid>
      </Section>
    </Section>
  );
}
