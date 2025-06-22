import type { SKU } from "@/lib/products";
type Props = {
    sku: SKU;
    /** Disable button until prerequisites are met (e.g. size chosen) */
    disabled?: boolean;
};
export default function AddToCartButton({ sku, disabled }: Props): import("react").JSX.Element;
export {};
