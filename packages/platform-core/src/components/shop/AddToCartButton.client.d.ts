import type { SKU } from "@acme/types";

type Props = {
    sku: SKU;
    /** Optional selected size */
    size?: string;
    /** Disable button until prerequisites are met (e.g. size chosen) */
    disabled?: boolean;
    /** Number of items to add */
    quantity?: number;
};
export default function AddToCartButton({ sku, size, disabled, quantity, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
