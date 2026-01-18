"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartDurableObject = exports.CloudflareDurableObjectCartStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
const CART_KEY = "cart";
/** Cloudflare Durable Object-backed implementation of CartStore */
class CloudflareDurableObjectCartStore {
    namespace;
    ttl;
    fallback;
    constructor(namespace, ttl, fallback) {
        this.namespace = namespace;
        this.ttl = ttl;
        this.fallback = fallback;
    }
    stub(id) {
        return this.namespace.get(this.namespace.idFromName(id));
    }
    async call(id, body) {
        const start = Date.now();
        try {
            const res = await this.stub(id).fetch("https://cart", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            const duration = Date.now() - start;
            if (duration > 200 && shouldLogLatency()) {
                console.warn(`Cart DO latency ${duration}ms for op=${body.op}`); // i18n-exempt -- internal diagnostic log
            }
            if (!res.ok)
                return undefined;
            return (await res.json());
        }
        catch (err) {
            console.warn("Cart DO call failed", err); // i18n-exempt -- internal diagnostic log
            return undefined;
        }
    }
    async createCart() {
        const id = crypto_1.default.randomUUID();
        const result = await this.call(id, { op: "init", ttl: this.ttl });
        if (result?.ok)
            return id;
        return this.fallback.createCart();
    }
    async getCart(id) {
        const result = await this.call(id, { op: "get", ttl: this.ttl });
        if (result?.ok && result.cart)
            return result.cart;
        return this.fallback.getCart(id);
    }
    async setCart(id, cart) {
        const result = await this.call(id, { op: "set", cart, ttl: this.ttl });
        if (!result?.ok) {
            await this.fallback.setCart(id, cart);
        }
    }
    async deleteCart(id) {
        // Removing a cart is equivalent to clearing it
        const result = await this.call(id, { op: "set", cart: {}, ttl: this.ttl });
        if (!result?.ok) {
            await this.fallback.deleteCart(id);
        }
    }
    async incrementQty(id, sku, qty, size, rental) {
        const result = await this.call(id, {
            op: "increment",
            sku,
            qty,
            size,
            rental,
            ttl: this.ttl,
        });
        if (result?.ok && result.cart)
            return result.cart;
        return this.fallback.incrementQty(id, sku, qty, size, rental);
    }
    async setQty(id, skuId, qty) {
        const result = await this.call(id, {
            op: "setQty",
            skuId,
            qty,
            ttl: this.ttl,
        });
        if (result?.ok) {
            return result.cart ?? null;
        }
        return this.fallback.setQty(id, skuId, qty);
    }
    async removeItem(id, skuId) {
        const result = await this.call(id, {
            op: "remove",
            skuId,
            ttl: this.ttl,
        });
        if (result?.ok) {
            return result.cart ?? null;
        }
        return this.fallback.removeItem(id, skuId);
    }
}
exports.CloudflareDurableObjectCartStore = CloudflareDurableObjectCartStore;
/** Durable Object implementation (to be bound via wrangler.toml as CART_DO) */
class CartDurableObject {
    state;
    constructor(state) {
        this.state = state;
    }
    async load() {
        const stored = await this.state.storage.get(CART_KEY);
        if (!stored)
            return null;
        if (stored.expiresAt <= Date.now()) {
            await this.state.storage.delete(CART_KEY);
            return null;
        }
        return stored;
    }
    async save(cart, ttlSeconds) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        await this.state.storage.put(CART_KEY, { cart, expiresAt });
    }
    upsertLine(cart, sku, qty, size, rental) {
        const key = size ? `${sku.id}:${size}` : sku.id;
        const current = cart[key]?.qty ?? 0;
        const nextQty = current + qty;
        const updated = { ...cart };
        if (nextQty <= 0) {
            delete updated[key];
            return updated;
        }
        updated[key] = { sku, size, rental, qty: nextQty };
        return updated;
    }
    setQty(cart, skuId, qty) {
        const updated = { ...cart };
        if (qty <= 0) {
            delete updated[skuId];
            return updated;
        }
        const existing = updated[skuId];
        if (!existing)
            return cart;
        updated[skuId] = { ...existing, qty };
        return updated;
    }
    async fetch(request) {
        try {
            const body = (await request.json());
            const stored = (await this.load()) ?? { cart: {}, expiresAt: 0 };
            let cart = stored.cart;
            switch (body.op) {
                case "init": {
                    cart = {};
                    await this.save(cart, body.ttl);
                    return json({ ok: true });
                }
                case "get": {
                    if (!cart || Object.keys(cart).length === 0) {
                        return json({ ok: true, cart: {} });
                    }
                    await this.save(cart, body.ttl); // touch TTL
                    return json({ ok: true, cart });
                }
                case "set": {
                    cart = body.cart;
                    await this.save(cart, body.ttl);
                    return json({ ok: true });
                }
                case "increment": {
                    cart = this.upsertLine(cart, body.sku, body.qty, body.size, body.rental);
                    await this.save(cart, body.ttl);
                    return json({ ok: true, cart });
                }
                case "setQty": {
                    cart = this.setQty(cart, body.skuId, body.qty);
                    await this.save(cart, body.ttl);
                    return json({ ok: true, cart });
                }
                case "remove": {
                    const updated = { ...cart };
                    if (!(body.skuId in updated)) {
                        return json({ ok: true, cart: null });
                    }
                    delete updated[body.skuId];
                    cart = updated;
                    await this.save(cart, body.ttl);
                    return json({ ok: true, cart });
                }
                default:
                    return json({ ok: false }, 400);
            }
        }
        catch (err) {
            console.error("CartDurableObject error", err); // i18n-exempt -- internal diagnostic log
            return json({ ok: false }, 500);
        }
    }
}
exports.CartDurableObject = CartDurableObject;
function json(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
    });
}
function shouldLogLatency() {
    // Avoid noisy logs in tests; process is undefined in Workers
    return !(typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV === "test");
}
