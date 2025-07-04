import * as React from "react";
import type { Product } from "./ProductCard";
export interface StickyAddToCartBarProps extends React.HTMLAttributes<HTMLDivElement> {
    product: Product;
    onAddToCart?: (product: Product) => void;
    ctaLabel?: string;
    /** Override default padding classes. */
    padding?: string;
}
/**
 * Sticky bottom bar showing product info and an add-to-cart button.
 */
export declare function StickyAddToCartBar({ product, onAddToCart, ctaLabel, padding, className, ...props }: StickyAddToCartBarProps): React.JSX.Element;
