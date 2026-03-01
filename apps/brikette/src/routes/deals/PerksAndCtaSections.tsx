import type { ComponentProps } from "react";

import { Section } from "@acme/design-system/atoms";
import { Button, Grid } from "@acme/design-system/primitives";

type DealPerk = {
  title: string;
  subtitle?: string;
};

export function DealsPerksSection({
  sectionId,
  heading,
  perks,
}: {
  sectionId: string;
  heading: string;
  perks: DealPerk[];
}): JSX.Element {
  return (
    <Section id={sectionId} padding="default" className="bg-brand-surface">
      <h2 className="mb-6 text-center text-2xl font-semibold text-brand-heading">{heading}</h2>
      <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-4">
        {perks.map((perk) => (
          <div
            key={perk.title}
            className="flex flex-col items-center rounded-lg border border-brand-outline/20 bg-brand-bg p-4 text-center"
          >
            <h3 className="font-medium text-brand-heading">{perk.title}</h3>
            {perk.subtitle ? <p className="mt-1 text-sm text-brand-text/70">{perk.subtitle}</p> : null}
          </div>
        ))}
      </Grid>
    </Section>
  );
}

export function DealsPrimaryCtaSection({
  label,
  onClick,
}: {
  label: string;
  onClick: NonNullable<ComponentProps<typeof Button>["onClick"]>;
}): JSX.Element {
  return (
    <Section padding="default" className="text-center">
      <Button onClick={onClick} size="md">
        {label}
      </Button>
    </Section>
  );
}
