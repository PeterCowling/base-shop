import * as React from "react";
import type { SKU } from "@acme/types";
export interface ProductMediaGalleryTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: SKU & {
        badges?: {
            label: string;
            variant?: "default" | "sale" | "new";
        }[];
    };
    onAddToCart?: (product: SKU) => void;
    ctaLabel?: string;
}
export declare function ProductMediaGalleryTemplate({ product, onAddToCart, ctaLabel, className, ...props }: ProductMediaGalleryTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductMediaGalleryTemplate.d.ts.map