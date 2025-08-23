import * as React from "react";
import type { SKU } from "@acme/types";
export interface FeaturedProductTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: SKU & {
        rating?: number;
        features?: string[];
    };
    onAddToCart?: (product: SKU) => void;
    ctaLabel?: string;
}
export declare function FeaturedProductTemplate({ product, onAddToCart, ctaLabel, className, ...props }: FeaturedProductTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FeaturedProductTemplate.d.ts.map