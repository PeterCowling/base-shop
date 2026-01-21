import type { SKU } from "@acme/types";

import type { CartState } from "../cart";
import type { CartStore } from "../cartStore";
/** In-memory implementation of CartStore */
export declare class MemoryCartStore implements CartStore {
    private ttl;
    private carts;
    constructor(ttl: number);
    createCart(): Promise<string>;
    getCart(id: string): Promise<CartState>;
    setCart(id: string, cart: CartState): Promise<void>;
    deleteCart(id: string): Promise<void>;
    incrementQty(id: string, sku: SKU, qty: number, size?: string): Promise<CartState>;
    setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
    removeItem(id: string, skuId: string): Promise<CartState | null>;
}
