import { type ReactNode } from "react";

import type { SKU } from "@acme/types";

import { type CartState } from "../cart";

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
} | {
    type: "clear";
};
type Dispatch = (action: Action) => Promise<void>;
export declare function CartProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useCart(): [CartState, Dispatch];
export {};
