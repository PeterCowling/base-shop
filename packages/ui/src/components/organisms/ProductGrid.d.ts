import * as React from "react";
import { Product } from "./ProductCard";
export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: Product[];
    columns?: number;
    showImage?: boolean;
    showPrice?: boolean;
    ctaLabel?: string;
    onAddToCart?: (product: Product) => void;
}
export declare function ProductGrid({ products, columns, showImage, showPrice, ctaLabel, onAddToCart, className, ...props }: ProductGridProps): import("react/jsx-runtime").JSX.Element;
