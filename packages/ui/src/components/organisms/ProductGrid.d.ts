import * as React from "react";
import type { SKU } from "@acme/types";
export type Product = SKU;
export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: SKU[];
    /**
     * Explicit number of columns. If omitted, the grid will
     * determine a responsive column count within the
     * `minItems`/`maxItems` range based on its width.
     */
    columns?: number;
    /** Minimum number of items to show */
    minItems?: number;
    /** Maximum number of items to show */
    maxItems?: number;
    /** Items shown on desktop viewports */
    desktopItems?: number;
    /** Items shown on tablet viewports */
    tabletItems?: number;
    /** Items shown on mobile viewports */
    mobileItems?: number;
    showImage?: boolean;
    showPrice?: boolean;
    ctaLabel?: string;
    onAddToCart?: (product: SKU) => void;
    /** Show quick view trigger for each product */
    enableQuickView?: boolean;
}
export declare function ProductGrid({ products, columns, minItems, maxItems, desktopItems, tabletItems, mobileItems, showImage, showPrice, ctaLabel, onAddToCart, enableQuickView, className, ...props }: ProductGridProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductGrid.d.ts.map