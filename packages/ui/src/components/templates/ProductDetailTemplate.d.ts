import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface ProductDetailTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: Product & {
        description?: string;
        badges?: {
            label: string;
            variant?: "default" | "sale" | "new";
        }[];
    };
    onAddToCart?: (product: Product) => void;
    ctaLabel?: string;
}
export declare function ProductDetailTemplate({ product, onAddToCart, ctaLabel, className, ...props }: ProductDetailTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductDetailTemplate.d.ts.map