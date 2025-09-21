// packages/platform-core/src/cartStore.ts
import { loadCoreEnv } from "@acme/config/env/core";
import type { SKU } from "@acme/types";
import type { Redis } from "@upstash/redis";
import type { CartState } from "./cart";
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

/** Lazy env accessor (prevents import-time throws) */
type CoreEnv = ReturnType<typeof loadCoreEnv>;
let _env: CoreEnv | null = null;
const getCoreEnv = (): CoreEnv => {
  if (_env) return _env;
  _env = loadCoreEnv();
  return _env;
};

/** Load @upstash/redis only if needed */
function loadRedis(): typeof import("@upstash/redis").Redis | undefined {
  try {
    return (
      eval("require")("@upstash/redis") as {
        Redis: typeof import("@upstash/redis").Redis;
      }
    ).Redis;
  } catch {
    return undefined;
  }
}

export function createMemoryCartStore(ttl: number): CartStore {
  return new MemoryCartStore(ttl);
}

export function createRedisCartStore(client: Redis, ttl: number): CartStore {
  return new RedisCartStore(client, ttl, new MemoryCartStore(ttl));
}

/** Factory (pure, no side effects) */
export function createCartStore(options: CartStoreOptions = {}): CartStore {
  const env = getCoreEnv();
  const ttl =
    options.ttlSeconds ??
    Number(env.CART_TTL ?? process.env.CART_TTL ?? DEFAULT_TTL);

  const hasRedis = Boolean(
    (env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL) &&
      (env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN)
  );
  const backend = options.backend ?? (env.SESSION_STORE ?? (hasRedis ? "redis" : "memory"));

  if (backend === "redis") {
    const Redis = loadRedis();
    const url = env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    const client = options.redis ?? (Redis && url && token ? new Redis({ url, token }) : undefined);
    if (client) {
      return createRedisCartStore(client, ttl);
    }
  }
  return createMemoryCartStore(ttl);
}

/* ------------------------------------------------------------------
 * Convenience wrappers around a lazily-created default store.
 * (Still no side effects until the first call is made.)
 * ------------------------------------------------------------------ */
let _defaultStore: CartStore | null = null;
export const getDefaultCartStore = (): CartStore => {
  if (_defaultStore) return _defaultStore;
  // In tests, `createCartStore` is spied via the module export.
  // Access through `module.exports` when available so the spy is hit.
  type ModuleWithCreateCartStore = NodeJS.Module & {
    exports?: { createCartStore?: typeof createCartStore };
  };
  const factory =
    typeof module !== "undefined" &&
    (module as ModuleWithCreateCartStore).exports?.createCartStore
      ? (module as ModuleWithCreateCartStore).exports.createCartStore
      : createCartStore;
  _defaultStore = factory();
  return _defaultStore!;
};

// Test-only helper to override the lazily created store
export const __setDefaultCartStore = (store: CartStore | null): void => {
  _defaultStore = store;
};

export const createCart = () => getDefaultCartStore().createCart();
export const getCart = (id: string) => getDefaultCartStore().getCart(id);
export const setCart = (id: string, cart: CartState) =>
  getDefaultCartStore().setCart(id, cart);
export const deleteCart = (id: string) => getDefaultCartStore().deleteCart(id);
export const incrementQty = (
  id: string,
  sku: SKU,
  qty: number,
  size?: string
) => getDefaultCartStore().incrementQty(id, sku, qty, size);
export const setQty = (id: string, skuId: string, qty: number) =>
  getDefaultCartStore().setQty(id, skuId, qty);
export const removeItem = (id: string, skuId: string) =>
  getDefaultCartStore().removeItem(id, skuId);
