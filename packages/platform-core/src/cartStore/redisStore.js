"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCartStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redisHelpers_1 = require("./redisHelpers");
const MAX_REDIS_FAILURES = 3;
/** Redis-backed implementation of CartStore */
class RedisCartStore {
    client;
    ttl;
    fallback;
    failures = 0;
    fallbackMode = false;
    constructor(client, ttl, fallback) {
        this.client = client;
        this.ttl = ttl;
        this.fallback = fallback;
    }
    async exec(fn) {
        if (this.fallbackMode)
            return undefined;
        try {
            const result = await fn();
            this.failures = 0;
            return result;
        }
        catch (err) {
            console.warn("Redis operation failed", err); // i18n-exempt -- Technical log, not user-facing
            this.failures += 1;
            if (this.failures >= MAX_REDIS_FAILURES) {
                console.error("Falling back to MemoryCartStore after repeated Redis failures" // i18n-exempt -- Technical log, not user-facing
                );
                this.fallbackMode = true;
            }
            return undefined;
        }
    }
    skuKey(id) {
        return `${id}:sku`;
    }
    async createCart() {
        const id = crypto_1.default.randomUUID();
        const fallbackId = await (0, redisHelpers_1.withFallback)([
            () => this.exec(() => this.client.hset(id, {})),
            () => this.exec(() => this.client.expire(id, this.ttl)),
        ], () => this.fallback.createCart());
        if (fallbackId !== undefined) {
            return fallbackId;
        }
        return id;
    }
    async getCart(id) {
        const qty = await this.exec(() => this.client.hgetall(id));
        const lines = await this.exec(() => this.client.hgetall(this.skuKey(id)));
        if (!qty || !lines) {
            return this.fallback.getCart(id);
        }
        const cart = {};
        for (const [lineId, q] of Object.entries(qty)) {
            const lineJson = lines[lineId];
            if (!lineJson)
                continue;
            const parsed = JSON.parse(lineJson);
            cart[lineId] = { sku: parsed.sku, size: parsed.size, rental: parsed.rental, qty: Number(q) };
        }
        return cart;
    }
    async setCart(id, cart) {
        const qty = {};
        const lines = {};
        for (const [lineId, line] of Object.entries(cart)) {
            qty[lineId] = line.qty;
            lines[lineId] = JSON.stringify({ sku: line.sku, size: line.size, rental: line.rental });
        }
        const ops = [
            () => this.exec(() => this.client.del(id)),
            () => this.exec(() => this.client.del(this.skuKey(id))),
        ];
        if (Object.keys(qty).length) {
            ops.push(() => this.exec(() => this.client.hset(id, qty)), () => this.exec(() => this.client.hset(this.skuKey(id), lines)));
        }
        ops.push(...(0, redisHelpers_1.expireBoth)(this.exec.bind(this), this.client, id, this.ttl, this.skuKey(id)));
        await (0, redisHelpers_1.withFallback)(ops, () => this.fallback.setCart(id, cart));
    }
    async deleteCart(id) {
        const ops = [
            () => this.exec(() => this.client.del(id)),
            () => this.exec(() => this.client.del(this.skuKey(id))),
        ];
        await (0, redisHelpers_1.withFallback)(ops, () => this.fallback.deleteCart(id));
    }
    async incrementQty(id, sku, qty, size, rental) {
        const key = size ? `${sku.id}:${size}` : sku.id;
        const ops = [
            () => this.exec(() => this.client.hincrby(id, key, qty)),
            () => this.exec(() => this.client.hset(this.skuKey(id), {
                [key]: JSON.stringify({ sku, size, rental }),
            })),
            ...(0, redisHelpers_1.expireBoth)(this.exec.bind(this), this.client, id, this.ttl, this.skuKey(id)),
        ];
        const fallbackCart = await (0, redisHelpers_1.withFallback)(ops, () => this.fallback.incrementQty(id, sku, qty, size, rental));
        if (fallbackCart !== undefined) {
            return fallbackCart;
        }
        return this.getCart(id);
    }
    async setQty(id, skuId, qty) {
        const exists = await this.exec(() => this.client.hexists(id, skuId));
        if (exists === undefined) {
            return this.fallback.setQty(id, skuId, qty);
        }
        if (!exists)
            return null;
        const ops = [];
        if (qty === 0) {
            ops.push(() => this.exec(() => this.client.hdel(id, skuId)), () => this.exec(() => this.client.hdel(this.skuKey(id), skuId)));
        }
        else {
            ops.push(() => this.exec(() => this.client.hset(id, { [skuId]: qty })));
        }
        ops.push(...(0, redisHelpers_1.expireBoth)(this.exec.bind(this), this.client, id, this.ttl, this.skuKey(id)));
        const fallbackCart = await (0, redisHelpers_1.withFallback)(ops, () => this.fallback.setQty(id, skuId, qty));
        if (fallbackCart !== undefined) {
            return fallbackCart;
        }
        return this.getCart(id);
    }
    async removeItem(id, skuId) {
        const removed = await this.exec(() => this.client.hdel(id, skuId));
        if (removed === undefined) {
            return this.fallback.removeItem(id, skuId);
        }
        if (removed === 0)
            return null;
        const ops = [
            () => this.exec(() => this.client.hdel(this.skuKey(id), skuId)),
            ...(0, redisHelpers_1.expireBoth)(this.exec.bind(this), this.client, id, this.ttl, this.skuKey(id)),
        ];
        const fallbackCart = await (0, redisHelpers_1.withFallback)(ops, () => this.fallback.removeItem(id, skuId));
        if (fallbackCart !== undefined) {
            return fallbackCart;
        }
        return this.getCart(id);
    }
}
exports.RedisCartStore = RedisCartStore;
