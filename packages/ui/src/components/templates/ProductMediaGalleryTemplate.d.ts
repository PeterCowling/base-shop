import * as React from "react";
import type { MediaItem } from "../molecules/MediaSelector";
import type { Product } from "../organisms/ProductCard";
export interface ProductMediaGalleryTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    product: Product & {
        media: MediaItem[];
        description?: string;
        badges?: {
            label: string;
            variant?: "default" | "sale" | "new";
        }[];
    };
    onAddToCart?: (product: Product) => void;
    ctaLabel?: string;
}
export declare function ProductMediaGalleryTemplate({ product, onAddToCart, ctaLabel, className, ...props }: ProductMediaGalleryTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductMediaGalleryTemplate.d.ts.map