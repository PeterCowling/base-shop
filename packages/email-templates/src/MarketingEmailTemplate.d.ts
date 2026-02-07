import * as React from "react";

export interface MarketingEmailTemplateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    logoSrc?: string;
    shopName?: string;
    headline: string;
    content: React.ReactNode;
    ctaLabel?: string;
    ctaHref?: string;
    footer?: React.ReactNode;
}
export declare function MarketingEmailTemplate({ logoSrc, shopName, headline, content, ctaLabel, ctaHref, footer, className, ...props }: MarketingEmailTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MarketingEmailTemplate.d.ts.map