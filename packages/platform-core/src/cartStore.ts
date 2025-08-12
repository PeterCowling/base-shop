import { Redis } from "@upstash/redis";
import { coreEnv } from "@acme/config/env/core";
import type { CartState } from "./cartCookie";
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
    const client =
      options.redis ??
      (coreEnv.UPSTASH_REDIS_REST_URL && coreEnv.UPSTASH_REDIS_REST_TOKEN
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

