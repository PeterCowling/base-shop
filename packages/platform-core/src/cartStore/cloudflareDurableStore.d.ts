import type { RentalLineItem,SKU } from "@acme/types";

import type { CartState } from "../cart";
import type { CartStore } from "../cartStore";

export interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
export interface DurableObjectId {
    toString(): string;
}
export interface DurableObjectStub {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
}
interface DurableObjectState {
    storage: DurableObjectStorage;
}
/** Cloudflare Durable Object-backed implementation of CartStore */
export declare class CloudflareDurableObjectCartStore implements CartStore {
    private namespace;
    private ttl;
    private fallback;
    constructor(namespace: DurableObjectNamespace, ttl: number, fallback: CartStore);
    private stub;
    private call;
    createCart(): Promise<string>;
    getCart(id: string): Promise<CartState>;
    setCart(id: string, cart: CartState): Promise<void>;
    deleteCart(id: string): Promise<void>;
    incrementQty(id: string, sku: SKU, qty: number, size?: string, rental?: RentalLineItem): Promise<CartState>;
    setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
    removeItem(id: string, skuId: string): Promise<CartState | null>;
}
/** Durable Object implementation (to be bound via wrangler.toml as CART_DO) */
export declare class CartDurableObject {
    private state;
    constructor(state: DurableObjectState);
    private load;
    private save;
    private upsertLine;
    private setQty;
    fetch(request: Request): Promise<Response>;
}
export {};
