import { type Redis } from "@upstash/redis";

import type { SKU } from "@acme/types";

import type { CartState } from "./cart";
/** Abstraction for cart storage backends */
export interface CartStore {
    createCart(): Promise<string>;
    getCart(id: string): Promise<CartState>;
    setCart(id: string, cart: CartState): Promise<void>;
    deleteCart(id: string): Promise<void>;
    incrementQty(id: string, sku: SKU, qty: number, size?: string): Promise<CartState>;
    setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
    removeItem(id: string, skuId: string): Promise<CartState | null>;
}
export interface CartStoreOptions {
    backend?: "memory" | "redis";
    ttlSeconds?: number;
    redis?: Redis;
}
export declare function createMemoryCartStore(ttl: number): CartStore;
export declare function createRedisCartStore(client: Redis, ttl: number): CartStore;
export declare function createCartStore(options?: CartStoreOptions): CartStore;
export declare const createCart: () => Promise<string>;
export declare const getCart: (id: string) => Promise<Record<string, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}>>;
export declare const setCart: (id: string, cart: CartState) => Promise<void>;
export declare const deleteCart: (id: string) => Promise<void>;
export declare const incrementQty: (id: string, sku: SKU, qty: number, size?: string) => Promise<Record<string, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}>>;
export declare const setQty: (id: string, skuId: string, qty: number) => Promise<Record<string, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}> | null>;
export declare const removeItem: (id: string, skuId: string) => Promise<Record<string, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}> | null>;
