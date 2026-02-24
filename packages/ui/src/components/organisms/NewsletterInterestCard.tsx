import * as React from "react";

import { cn } from "../../utils/style";

export interface NewsletterInterestCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description: React.ReactNode;
  channelLabel: React.ReactNode;
  channelValue: React.ReactNode;
  ctaLabel: React.ReactNode;
  legalNote?: React.ReactNode;
}

export function NewsletterInterestCard({
  title,
  description,
  channelLabel,
  channelValue,
  ctaLabel,
  legalNote,
  className,
  ...props
}: NewsletterInterestCardProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {channelLabel}
        </div>
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-foreground">
          {channelValue}
        </div>
        <div className="inline-flex min-w-[120px] items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold text-muted-foreground">
          {ctaLabel}
        </div>
        {legalNote ? <p className="text-xs">{legalNote}</p> : null}
      </div>
    </div>
  );
}
