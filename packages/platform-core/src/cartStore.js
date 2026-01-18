"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItem = exports.setQty = exports.incrementQty = exports.deleteCart = exports.setCart = exports.getCart = exports.createCart = exports.__setDefaultCartStore = exports.getDefaultCartStore = void 0;
exports.createMemoryCartStore = createMemoryCartStore;
exports.createRedisCartStore = createRedisCartStore;
exports.createCloudflareCartStore = createCloudflareCartStore;
exports.createCartStore = createCartStore;
// packages/platform-core/src/cartStore.ts
const core_1 = require("@acme/config/env/core");
const memoryStore_1 = require("./cartStore/memoryStore");
const redisStore_1 = require("./cartStore/redisStore");
const cloudflareDurableStore_1 = require("./cartStore/cloudflareDurableStore");
const DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
let _env = null;
const getCoreEnv = () => {
    if (_env)
        return _env;
    _env = (0, core_1.loadCoreEnv)();
    return _env;
};
/** Load @upstash/redis only if needed */
function loadRedis() {
    try {
        return eval("require")("@upstash/redis").Redis;
    }
    catch {
        return undefined;
    }
}
function createMemoryCartStore(ttl) {
    return new memoryStore_1.MemoryCartStore(ttl);
}
function createRedisCartStore(client, ttl) {
    return new redisStore_1.RedisCartStore(client, ttl, new memoryStore_1.MemoryCartStore(ttl));
}
function createCloudflareCartStore(namespace, ttl) {
    return new cloudflareDurableStore_1.CloudflareDurableObjectCartStore(namespace, ttl, new memoryStore_1.MemoryCartStore(ttl));
}
/** Factory (pure, no side effects) */
function createCartStore(options = {}) {
    const env = getCoreEnv();
    const ttl = options.ttlSeconds ??
        Number(env.CART_TTL ?? process.env.CART_TTL ?? DEFAULT_TTL);
    const hasRedis = Boolean((env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL) &&
        (env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN));
    const backend = options.backend ??
        env.CART_STORE_PROVIDER ??
        (env.SESSION_STORE ?? (hasRedis ? "redis" : "memory"));
    if (backend === "redis") {
        const Redis = loadRedis();
        const url = env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
        const token = env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
        const client = options.redis ?? (Redis && url && token ? new Redis({ url, token }) : undefined);
        if (client) {
            return createRedisCartStore(client, ttl);
        }
    }
    if (backend === "cloudflare") {
        const namespace = options.cloudflare ?? globalThis.CART_DO;
        if (namespace) {
            return createCloudflareCartStore(namespace, ttl);
        }
        console.warn("CART_STORE_PROVIDER=cloudflare but no Durable Object binding found; falling back to MemoryCartStore");
    }
    return createMemoryCartStore(ttl);
}
/* ------------------------------------------------------------------
 * Convenience wrappers around a lazily-created default store.
 * (Still no side effects until the first call is made.)
 * ------------------------------------------------------------------ */
let _defaultStore = null;
const getDefaultCartStore = () => {
    if (_defaultStore)
        return _defaultStore;
    const factory = typeof module !== "undefined" &&
        module.exports?.createCartStore
        ? module.exports.createCartStore
        : createCartStore;
    _defaultStore = factory();
    return _defaultStore;
};
exports.getDefaultCartStore = getDefaultCartStore;
// Test-only helper to override the lazily created store
const __setDefaultCartStore = (store) => {
    _defaultStore = store;
};
exports.__setDefaultCartStore = __setDefaultCartStore;
const createCart = () => (0, exports.getDefaultCartStore)().createCart();
exports.createCart = createCart;
const getCart = (id) => (0, exports.getDefaultCartStore)().getCart(id);
exports.getCart = getCart;
const setCart = (id, cart) => (0, exports.getDefaultCartStore)().setCart(id, cart);
exports.setCart = setCart;
const deleteCart = (id) => (0, exports.getDefaultCartStore)().deleteCart(id);
exports.deleteCart = deleteCart;
const incrementQty = (id, sku, qty, size, rental) => {
    const store = (0, exports.getDefaultCartStore)();
    // Only pass `rental` when defined to avoid an extra undefined arg
    return typeof rental === "undefined"
        ? store.incrementQty(id, sku, qty, size)
        : store.incrementQty(id, sku, qty, size, rental);
};
exports.incrementQty = incrementQty;
const setQty = (id, skuId, qty) => (0, exports.getDefaultCartStore)().setQty(id, skuId, qty);
exports.setQty = setQty;
const removeItem = (id, skuId) => (0, exports.getDefaultCartStore)().removeItem(id, skuId);
exports.removeItem = removeItem;
