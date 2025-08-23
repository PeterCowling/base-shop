import * as React from "react";
export interface FooterLink {
    label: string;
    href: string;
}
export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
    links?: FooterLink[];
    logo?: string;
}
export declare const Footer: React.ForwardRefExoticComponent<FooterProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Footer.d.ts.map