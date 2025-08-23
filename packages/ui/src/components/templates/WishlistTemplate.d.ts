import * as React from "react";
import type { SKU } from "@acme/types";
export interface WishlistItem extends SKU {
    quantity?: number;
}
export interface WishlistTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    items: WishlistItem[];
    onAddToCart?: (item: WishlistItem) => void;
    onRemove?: (item: WishlistItem) => void;
    ctaAddToCartLabel?: string;
    ctaRemoveLabel?: string;
}
export declare function WishlistTemplate({ items, onAddToCart, onRemove, ctaAddToCartLabel, ctaRemoveLabel, className, ...props }: WishlistTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WishlistTemplate.d.ts.map