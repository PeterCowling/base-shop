import * as React from "react";
import { Logo, type LogoProps } from "@acme/ui";

export interface MarketingEmailTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** Props to configure the shop logo */
  logo?: Omit<LogoProps, "shopName">;
  /** Name of the shop for alt text or fallback */
  shopName?: string;
  headline: string;
  content: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: React.ReactNode;
}

export function MarketingEmailTemplate({
  logo,
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
    throw new Error("headline and content are required");
  }
  if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
    throw new Error("ctaLabel and ctaHref must both be provided");
  }

  const showCta = Boolean(ctaLabel && ctaHref);

  return (
    <div
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm${className ? ` ${className}` : ""}`}
      {...props}
    >
      {shopName && (
        <div className="bg-muted p-6 text-center" data-token="--color-muted">
          <Logo
            shopName={shopName}
            alt={logo?.alt ?? shopName}
            width={logo?.width ?? 40}
            height={logo?.height ?? 40}
            className={`mx-auto${logo?.className ? ` ${logo.className}` : ""}`}
            src={logo?.src}
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
              className="bg-primary inline-block rounded-md px-4 py-2 font-medium"
              data-token="--color-primary"
            >
              <span
                className="text-primary-foreground"
                data-token="--color-primary-fg"
              >
                {ctaLabel}
              </span>
            </a>
          </div>
        )}
      </div>
      {footer && (
        <div
          className="bg-muted border-t p-4 text-center text-xs text-muted"
          data-token="--color-muted"
        >
          {footer}
        </div>
      )}
    </div>
  );
}
