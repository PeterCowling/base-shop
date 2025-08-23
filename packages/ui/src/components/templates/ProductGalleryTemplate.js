import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { ProductCarousel } from "../organisms/ProductCarousel";
import { ProductGrid } from "../organisms/ProductGrid";
/**
 * Display a list of products in a grid or carousel layout.
 */
export function ProductGalleryTemplate({ products, useCarousel = false, minItems, maxItems, className, ...props }) {
    if (useCarousel) {
        return (_jsx(ProductCarousel, { products: products, minItems: minItems, maxItems: maxItems, className: className, ...props }));
    }
    return (_jsx(ProductGrid, { products: products, minItems: minItems, maxItems: maxItems, className: className, ...props }));
}
