import type { SKU } from "@acme/types";
export interface ProductBundleProps {
    skus?: SKU[];
    /** Percentage discount applied to the combined price */
    discount?: number;
    /** Quantity of bundles */
    quantity?: number;
}
/**
 * Display a list of products with a combined bundle price.
 */
export default function ProductBundle({ skus, discount, quantity, }: ProductBundleProps): import("react/jsx-runtime").JSX.Element | null;
export declare function getRuntimeProps(): {
    skus: SKU[];
};
//# sourceMappingURL=ProductBundle.d.ts.map