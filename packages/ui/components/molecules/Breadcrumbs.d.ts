import * as React from "react";
export interface BreadcrumbItem {
    label: React.ReactNode;
    href?: string;
}
export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
    items: BreadcrumbItem[];
}
export declare function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps): React.JSX.Element;
export declare namespace Breadcrumbs {
    var displayName: string;
}
export default Breadcrumbs;
