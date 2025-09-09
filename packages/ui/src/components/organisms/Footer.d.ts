import * as React from "react";
import type { LogoVariants } from "./types";
export interface FooterLink {
    label: string;
    href: string;
}
export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
    links?: FooterLink[];
    logoVariants?: LogoVariants;
    shopName: string;
}
export declare const Footer: React.ForwardRefExoticComponent<FooterProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Footer.d.ts.map