import * as React from "react";
import type { SKU } from "@acme/types";
export interface StickyAddToCartBarProps extends React.HTMLAttributes<HTMLDivElement> {
    product: SKU;
    onAddToCart?: (product: SKU) => void;
    ctaLabel?: string;
    /** Override default padding classes. */
    padding?: string;
}
/**
 * Sticky bottom bar showing product info and an add-to-cart button.
 */
export declare function StickyAddToCartBar({ product, onAddToCart, ctaLabel, padding, className, ...props }: StickyAddToCartBarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=StickyAddToCartBar.d.ts.map