import type { Redis } from "@upstash/redis";
import { coreEnv } from "@acme/config/env/core";
import type { CartState } from "./cart";
import type { SKU } from "@acme/types";
import { MemoryCartStore } from "./cartStore/memoryStore";
import { RedisCartStore } from "./cartStore/redisStore";

/** Abstraction for cart storage backends */
export interface CartStore {
  createCart(): Promise<string>;
  getCart(id: string): Promise<CartState>;
  setCart(id: string, cart: CartState): Promise<void>;
  deleteCart(id: string): Promise<void>;
  incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string
  ): Promise<CartState>;
  setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
  removeItem(id: string, skuId: string): Promise<CartState | null>;
}

export interface CartStoreOptions {
  backend?: "memory" | "redis";
  ttlSeconds?: number;
  redis?: Redis;
}

function loadRedis(): typeof import("@upstash/redis").Redis | undefined {
  try {
    return (eval("require")("@upstash/redis") as { Redis: typeof import("@upstash/redis").Redis }).Redis;
  } catch {
    return undefined;
  }
}

const DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

export function createMemoryCartStore(ttl: number): CartStore {
  return new MemoryCartStore(ttl);
}

export function createRedisCartStore(
  client: Redis,
  ttl: number
): CartStore {
  return new RedisCartStore(client, ttl, new MemoryCartStore(ttl));
}

export function createCartStore(options: CartStoreOptions = {}): CartStore {
  const ttl = options.ttlSeconds ?? Number(coreEnv.CART_TTL ?? DEFAULT_TTL);
  const backend =
    options.backend ??
    coreEnv.SESSION_STORE ??
    (coreEnv.UPSTASH_REDIS_REST_URL && coreEnv.UPSTASH_REDIS_REST_TOKEN
      ? "redis"
      : "memory");

  if (backend === "redis") {
    const Redis = loadRedis();
    const client =
      options.redis ??
      (Redis && coreEnv.UPSTASH_REDIS_REST_URL && coreEnv.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: coreEnv.UPSTASH_REDIS_REST_URL,
            token: coreEnv.UPSTASH_REDIS_REST_TOKEN,
          })
        : undefined);
    if (client) {
      return createRedisCartStore(client, ttl);
    }
  }
  return createMemoryCartStore(ttl);
}

/* ------------------------------------------------------------------
 * Convenience wrappers around a default store instance
 * ------------------------------------------------------------------ */

const defaultStore = createCartStore();

export const createCart = () => defaultStore.createCart();
export const getCart = (id: string) => defaultStore.getCart(id);
export const setCart = (id: string, cart: CartState) =>
  defaultStore.setCart(id, cart);
export const deleteCart = (id: string) => defaultStore.deleteCart(id);
export const incrementQty = (
  id: string,
  sku: SKU,
  qty: number,
  size?: string,
) => defaultStore.incrementQty(id, sku, qty, size);
export const setQty = (id: string, skuId: string, qty: number) =>
  defaultStore.setQty(id, skuId, qty);
export const removeItem = (id: string, skuId: string) =>
  defaultStore.removeItem(id, skuId);

