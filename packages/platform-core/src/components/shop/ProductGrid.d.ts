import type { SKU } from "@acme/types";

type Props = {
    skus: SKU[];
    columns?: number;
    /** Minimum number of products to display */
    minItems?: number;
    /** Maximum number of products to display */
    maxItems?: number;
    /** Items shown on desktop viewports */
    desktopItems?: number;
    /** Items shown on tablet viewports */
    tabletItems?: number;
    /** Items shown on mobile viewports */
    mobileItems?: number;
    className?: string;
};
declare function ProductGridInner({ skus, columns, minItems, maxItems, desktopItems, tabletItems, mobileItems, className, }: Props): import("react/jsx-runtime").JSX.Element;
export declare const ProductGrid: import("react").MemoExoticComponent<typeof ProductGridInner>;
export {};
