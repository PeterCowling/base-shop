import * as React from "react";
import type { SKU } from "@acme/types";
export type Product = SKU;
export interface ProductCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
    products: SKU[];
    /** Minimum number of items to show at once */
    minItems?: number;
    /** Maximum number of items to show at once */
    maxItems?: number;
    /** Items shown on desktop viewports */
    desktopItems?: number;
    /** Items shown on tablet viewports */
    tabletItems?: number;
    /** Items shown on mobile viewports */
    mobileItems?: number;
    /** flex gap class applied to the inner scroller */
    gapClassName?: string;
    /**
     * Function to calculate the width of each slide based on
     * the current itemsPerSlide value. Should return a CSS
     * width value such as "33.333%".
     */
    getSlideWidth?: (itemsPerSlide: number) => string;
    className?: string;
    /** Show quick view trigger for each item */
    enableQuickView?: boolean;
    onAddToCart?: (product: SKU) => void;
}
/**
 * Horizontally scrollable carousel for product cards.
 * The number of items per slide adapts to the component width
 * and stays within the provided `minItems`/`maxItems` range.
 */
export declare function ProductCarousel({ products, minItems, maxItems, desktopItems, tabletItems, mobileItems, gapClassName, getSlideWidth, className, enableQuickView, onAddToCart, ...props }: ProductCarouselProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductCarousel.d.ts.map