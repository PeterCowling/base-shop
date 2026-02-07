import * as React from "react";

import { Logo } from "@acme/ui/components/atoms/Logo";

export interface MarketingEmailTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  logoSrc?: React.ComponentProps<typeof Logo>["src"];
  logoSources?: React.ComponentProps<typeof Logo>["sources"];
  shopName?: string;
  headline: string;
  content: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: React.ReactNode;
}

export function MarketingEmailTemplate({
  logoSrc,
  logoSources,
  shopName,
  headline,
  content,
  ctaLabel,
  ctaHref,
  footer,
  className,
  ...props
}: MarketingEmailTemplateProps) {
  if (!headline || content == null) {
    // i18n-exempt: Internal developer error message, not user-facing
    throw new Error("headline and content are required");
  }
  if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
    // i18n-exempt: Internal developer error message, not user-facing
    throw new Error("ctaLabel and ctaHref must both be provided");
  }

  const showCta = Boolean(ctaLabel && ctaHref);
  const showHeader = Boolean(shopName);

  return (
    <div
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm${className ? ` ${className}` : ""}`}
      {...props}
    >
      {showHeader && (
        <div
          className="bg-muted p-6 text-center" // i18n-exempt: class names/design tokens, not user-visible copy
          data-token="--color-muted" // i18n-exempt: design token attribute, not user-visible copy
        >
          <Logo
            src={logoSrc}
            sources={logoSources}
            width={40}
            height={40}
            alt={shopName}
            fallbackText={shopName ?? ""}
            className="mx-auto"
          />
        </div>
      )}
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-bold">{headline}</h1>
        <div className="leading-6">{content}</div>
        {showCta && (
          <div className="text-center">
            <a
              href={ctaHref}
              className="bg-primary inline-block rounded-md px-4 py-2 font-medium min-h-11 min-w-11"
              data-token="--color-primary" // i18n-exempt: design token attribute, not user-visible copy
            >
              <span
                className="text-primary-foreground" // i18n-exempt: class names/design tokens, not user-visible copy
                data-token="--color-primary-fg" // i18n-exempt: design token attribute, not user-visible copy
              >
                {ctaLabel}
              </span>
            </a>
          </div>
        )}
      </div>
      {footer && (
        <div
          className="bg-muted border-t p-4 text-center text-xs text-muted" // i18n-exempt: class names/design tokens, not user-visible copy
          data-token="--color-muted" // i18n-exempt: design token attribute, not user-visible copy
        >
          {footer}
        </div>
      )}
    </div>
  );
}
