import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface WishlistItem extends Product {
    quantity?: number;
}
export interface WishlistTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    items: WishlistItem[];
    onAddToCart?: (item: WishlistItem) => void;
    onRemove?: (item: WishlistItem) => void;
    ctaAddToCartLabel?: string;
    ctaRemoveLabel?: string;
}
export declare function WishlistTemplate({ items, onAddToCart, onRemove, ctaAddToCartLabel, ctaRemoveLabel, className, ...props }: WishlistTemplateProps): React.JSX.Element;
