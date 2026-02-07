import React from "react";
import Link from "next/link";

import Stack from "@/components/layout/Stack";

type NotFoundContentProps = {
  title: string;
  body: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
};

const NotFoundContent = React.memo(function NotFoundContent({
  title,
  body,
  primaryCta,
  primaryHref,
  secondaryCta,
  secondaryHref,
}: NotFoundContentProps) {
  return (
    <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6 text-center">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <Stack className="mt-6 gap-3">
        <Link
          href={primaryHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-accent focus-visible:focus-ring"
        >
          {primaryCta}
        </Link>
        <Link
          href={secondaryHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-1 px-5 text-sm font-semibold text-foreground transition hover:border-primary/70 hover:text-accent focus-visible:focus-ring"
        >
          {secondaryCta}
        </Link>
      </Stack>
    </div>
  );
});

export default NotFoundContent;
