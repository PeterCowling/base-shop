import * as React from "react";
export interface MarketingEmailTemplateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    logoSrc?: string;
    headline: string;
    content: React.ReactNode;
    ctaLabel?: string;
    ctaHref?: string;
    footer?: React.ReactNode;
}
export declare function MarketingEmailTemplate({ logoSrc, headline, content, ctaLabel, ctaHref, footer, className, ...props }: MarketingEmailTemplateProps): React.JSX.Element;
