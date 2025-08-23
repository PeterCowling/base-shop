import * as React from "react";
import type { SKU } from "@acme/types";
export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
    product: SKU;
    onAddToCart?: (product: SKU) => void;
    showImage?: boolean;
    showPrice?: boolean;
    ctaLabel?: string;
    /** Override default padding classes. */
    padding?: string;
    /** Optional width */
    width?: string | number;
    /** Optional height */
    height?: string | number;
    /** Optional margin classes */
    margin?: string;
}
export declare const ProductCard: React.ForwardRefExoticComponent<ProductCardProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=ProductCard.d.ts.map