/// <reference types="react" />
import type { SKU } from "@types";
declare function ProductCardInner({ sku }: {
    sku: SKU;
}): import("react").JSX.Element;
export declare const ProductCard: import("react").MemoExoticComponent<typeof ProductCardInner>;
export {};
