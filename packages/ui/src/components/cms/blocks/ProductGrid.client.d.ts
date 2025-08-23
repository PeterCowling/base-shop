import type { SKU } from "@acme/types";
export interface ProductGridProps {
    skus?: SKU[];
    collectionId?: string;
    columns?: number;
    minItems?: number;
    maxItems?: number;
    desktopItems?: number;
    tabletItems?: number;
    mobileItems?: number;
    className?: string;
}
export default function ProductGrid({ skus, collectionId, columns, minItems, maxItems, desktopItems, tabletItems, mobileItems, className, }: ProductGridProps): import("react/jsx-runtime").JSX.Element;
export declare function getRuntimeProps(): {
    skus: SKU[];
};
//# sourceMappingURL=ProductGrid.client.d.ts.map