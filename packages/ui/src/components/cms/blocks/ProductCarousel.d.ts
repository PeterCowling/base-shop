import { type ProductCarouselProps as BaseProps } from "../../organisms/ProductCarousel";
import type { SKU } from "@acme/types";
export interface CmsProductCarouselProps extends Omit<BaseProps, "products"> {
    skus?: SKU[];
    collectionId?: string;
}
export declare function getRuntimeProps(): {
    products: SKU[];
};
export default function CmsProductCarousel({ skus, collectionId, minItems, maxItems, desktopItems, tabletItems, mobileItems, ...rest }: CmsProductCarouselProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProductCarousel.d.ts.map