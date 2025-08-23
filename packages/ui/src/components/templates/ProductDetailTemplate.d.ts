import * as React from "react";
import type { SKU } from "@acme/types";
export interface ProductDetailTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: SKU & {
        badges?: {
            label: string;
            variant?: "default" | "sale" | "new";
        }[];
    };
    onAddToCart?: (product: SKU) => void;
    ctaLabel?: string;
}
export declare function ProductDetailTemplate({ product, onAddToCart, ctaLabel, className, ...props }: ProductDetailTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductDetailTemplate.d.ts.map