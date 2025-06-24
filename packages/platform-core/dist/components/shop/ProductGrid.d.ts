import type { SKU } from "@/lib/products";
type Props = {
    skus: SKU[];
};
declare function ProductGridInner({ skus }: Props): import("react/jsx-runtime").JSX.Element;
export declare const ProductGrid: import("react").MemoExoticComponent<typeof ProductGridInner>;
export {};
