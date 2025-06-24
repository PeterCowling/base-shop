import type { SKU } from "@/lib/products";
import { ReactNode } from "react";
type CartLine = {
    sku: SKU;
    qty: number;
};
export type CartState = Record<SKU["id"], CartLine>;
type Action = {
    type: "add";
    sku: SKU;
} | {
    type: "remove";
    id: SKU["id"];
} | {
    type: "setQty";
    id: SKU["id"];
    qty: number;
};
export declare function CartProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCart(): [CartState, import("react").Dispatch<Action>];
export {};
