import Image from "next/image";

import * as React from "react";
import { cn } from "../../utils/style";

export interface MarketingEmailTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  logoSrc?: string;
  headline: string;
  content: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: React.ReactNode;
}

export function MarketingEmailTemplate({
  logoSrc,
  headline,
  content,
  ctaLabel,
  ctaHref,
  footer,
  className,
  ...props
}: MarketingEmailTemplateProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm",
        className
      )}
      {...props}
    >
      {logoSrc && (
        <div className="bg-muted p-6 text-center">
          <Image
            src={logoSrc}
            alt="logo"
            width={40}
            height={40}
            className="mx-auto h-10 w-auto"
          />
        </div>
      )}
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold">{headline}</h1>
        <div className="leading-6">{content}</div>
        {ctaLabel && ctaHref && (
          <div className="text-center">
            <a
              href={ctaHref}
              className="bg-primary text-primary-foreground inline-block rounded-md px-4 py-2 font-medium"
            >
              {ctaLabel}
            </a>
          </div>
        )}
      </div>
      {footer && (
        <div className="bg-muted border-t p-4 text-center text-xs text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}
