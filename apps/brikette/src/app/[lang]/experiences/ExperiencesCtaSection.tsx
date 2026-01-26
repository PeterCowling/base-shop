"use client";

import Link from "next/link";

import { Button } from "@acme/design-system/primitives";

type Props = {
  title?: string;
  subtitle?: string;
  bookLabel?: string;
  onBookClick?: () => void;
  eventsLabel?: string;
  eventsHref?: string;
  breakfastLabel?: string;
  breakfastHref?: string;
  conciergeLabel?: string;
  onConciergeClick?: () => void;
};

export function ExperiencesCtaSection({
  title,
  subtitle,
  bookLabel,
  onBookClick,
  eventsLabel,
  eventsHref,
  breakfastLabel,
  breakfastHref,
  conciergeLabel,
  onConciergeClick,
}: Props): JSX.Element | null {
  const hasContent = Boolean(
    title ||
      subtitle ||
      bookLabel ||
      eventsLabel ||
      breakfastLabel ||
      conciergeLabel,
  );

  if (!hasContent) return null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="rounded-3xl border border-brand-outline/30 bg-gradient-to-br from-brand-primary/10 via-brand-surface to-brand-primary/5 p-8 text-center shadow-sm dark:border-brand-outline/55 dark:from-brand-secondary/10 dark:via-brand-bg dark:to-brand-secondary/5">
        {title ? (
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-heading sm:text-3xl">
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-3xl text-base text-brand-paragraph dark:text-brand-paragraph">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {bookLabel ? (
            <Button onClick={onBookClick} size="lg">
              {bookLabel}
            </Button>
          ) : null}
          {eventsLabel && eventsHref ? (
            <Button asChild size="lg" tone="outline">
              <Link href={eventsHref}>{eventsLabel}</Link>
            </Button>
          ) : null}
          {breakfastLabel && breakfastHref ? (
            <Button asChild size="lg" tone="outline">
              <Link href={breakfastHref}>{breakfastLabel}</Link>
            </Button>
          ) : null}
          {conciergeLabel ? (
            <Button onClick={onConciergeClick} size="lg" tone="outline">
              {conciergeLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ExperiencesCtaSection;
