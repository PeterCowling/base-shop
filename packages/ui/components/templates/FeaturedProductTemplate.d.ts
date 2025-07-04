import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface FeaturedProductTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: Product & {
        rating?: number;
        features?: string[];
    };
    onAddToCart?: (product: Product) => void;
    ctaLabel?: string;
}
export declare function FeaturedProductTemplate({ product, onAddToCart, ctaLabel, className, ...props }: FeaturedProductTemplateProps): React.JSX.Element;
