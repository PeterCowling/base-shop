import type { SKU } from "@acme/types";
interface Props {
    skus?: SKU[];
    /** Attributes to display from each SKU (e.g. price, stock) */
    attributes: Array<Extract<keyof SKU, string>>;
}
/**
 * Display a simple comparison table for selected products.
 */
export default function ProductComparisonBlock({ skus, attributes }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ProductComparisonBlock.d.ts.map