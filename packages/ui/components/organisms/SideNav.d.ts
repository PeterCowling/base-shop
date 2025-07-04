import * as React from "react";
export interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Tailwind width class or CSS length */
    width?: string;
}
export declare const SideNav: React.ForwardRefExoticComponent<SideNavProps & React.RefAttributes<HTMLDivElement>>;
