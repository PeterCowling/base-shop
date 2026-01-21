import type { SKU } from "@acme/types";
export interface FeaturedProductBlockProps {
    sku?: SKU;
    collectionId?: string;
}
export declare function getRuntimeProps(): {
    sku: SKU;
};
export default function FeaturedProductBlock({ sku, collectionId, }: FeaturedProductBlockProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FeaturedProductBlock.d.ts.map