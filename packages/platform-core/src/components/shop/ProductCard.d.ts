import type { SKU } from "@acme/types";
declare function ProductCardInner({ sku }: {
    sku: SKU;
}): import("react/jsx-runtime").JSX.Element;
export declare const ProductCard: import("react").MemoExoticComponent<typeof ProductCardInner>;
export {};
