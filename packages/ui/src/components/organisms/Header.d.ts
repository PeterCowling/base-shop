import type { Locale } from "@acme/i18n/locales";
import * as React from "react";
export interface NavItem {
    title: string;
    href: string;
}
export interface NavSection extends NavItem {
    items?: NavItem[];
}
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    /** Top level navigation sections */
    nav?: NavSection[];
    /** Search suggestions for predictive search */
    searchSuggestions?: string[];
    /** Currently selected locale */
    locale: Locale;
    /** Optional logo text */
    logo?: string;
}
export declare const Header: React.ForwardRefExoticComponent<HeaderProps & React.RefAttributes<HTMLElement>>;
//# sourceMappingURL=Header.d.ts.map