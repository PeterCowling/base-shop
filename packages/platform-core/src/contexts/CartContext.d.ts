import { type CartState } from "../cartCookie";
import type { SKU } from "@acme/types";
import { type ReactNode } from "react";
type Action = {
    type: "add";
    sku: SKU;
    size?: string;
    qty?: number;
} | {
    type: "remove";
    id: string;
} | {
    type: "setQty";
    id: string;
    qty: number;
};
type Dispatch = (action: Action) => Promise<void>;
export declare function CartProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCart(): [CartState, Dispatch];
export {};
