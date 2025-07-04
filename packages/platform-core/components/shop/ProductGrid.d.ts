/// <reference types="react" />
import type { SKU } from "@types";
type Props = {
    skus: SKU[];
};
declare function ProductGridInner({ skus }: Props): import("react").JSX.Element;
export declare const ProductGrid: import("react").MemoExoticComponent<typeof ProductGridInner>;
export {};
