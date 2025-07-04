/// <reference types="react" />
import type { SKU } from "@types";
type Props = {
    sku: SKU;
    /** Optional selected size */
    size?: string;
    /** Disable button until prerequisites are met (e.g. size chosen) */
    disabled?: boolean;
};
export default function AddToCartButton({ sku, size, disabled, }: Props): import("react").JSX.Element;
export {};
