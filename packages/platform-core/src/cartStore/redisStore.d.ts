import type { Redis } from "@upstash/redis";

import type { SKU } from "@acme/types";

import type { CartState } from "../cart";
import type { CartStore } from "../cartStore";
/** Redis-backed implementation of CartStore */
export declare class RedisCartStore implements CartStore {
    private client;
    private ttl;
    private fallback;
    private failures;
    private fallbackMode;
    constructor(client: Redis, ttl: number, fallback: CartStore);
    private exec;
    private skuKey;
    createCart(): Promise<string>;
    getCart(id: string): Promise<CartState>;
    setCart(id: string, cart: CartState): Promise<void>;
    deleteCart(id: string): Promise<void>;
    incrementQty(id: string, sku: SKU, qty: number, size?: string): Promise<CartState>;
    setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
    removeItem(id: string, skuId: string): Promise<CartState | null>;
}
