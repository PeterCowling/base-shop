export interface Crumb {
    href: string;
    label: string;
}
/**
 * Minimal breadcrumbs helper. When a collection tree is not available,
 * it falls back to deriving labels from the URL path segments.
 */
export declare function getBreadcrumbs(pathname: string, title?: string): Crumb[];
