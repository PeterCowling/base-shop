import * as React from "react";
import { type LogoProps } from "@acme/ui";
export interface MarketingEmailTemplateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
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
export declare function MarketingEmailTemplate({ logo, shopName, headline, content, ctaLabel, ctaHref, footer, className, ...props }: MarketingEmailTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=MarketingEmailTemplate.d.ts.map