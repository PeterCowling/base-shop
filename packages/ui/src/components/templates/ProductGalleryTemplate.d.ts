import * as React from "react";
import { Product } from "../organisms/ProductCard";
export interface ProductGalleryTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    products: Product[];
    useCarousel?: boolean;
    itemsPerSlide?: number;
}
/**
 * Display a list of products in a grid or carousel layout.
 */
export declare function ProductGalleryTemplate({ products, useCarousel, itemsPerSlide, className, ...props }: ProductGalleryTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductGalleryTemplate.d.ts.map