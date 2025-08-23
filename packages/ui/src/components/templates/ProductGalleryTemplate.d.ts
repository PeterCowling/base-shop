import * as React from "react";
import type { SKU } from "@acme/types";
export interface ProductGalleryTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    products: SKU[];
    useCarousel?: boolean;
    /** Minimum items to show per row or slide */
    minItems?: number;
    /** Maximum items to show per row or slide */
    maxItems?: number;
}
/**
 * Display a list of products in a grid or carousel layout.
 */
export declare function ProductGalleryTemplate({ products, useCarousel, minItems, maxItems, className, ...props }: ProductGalleryTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductGalleryTemplate.d.ts.map