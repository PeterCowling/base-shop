import type { CartState, SKU } from "@types";
import { ReactNode } from "react";
type Action = {
    type: "add";
    sku: SKU;
    size?: string;
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
