"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCartStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
/** In-memory implementation of CartStore */
class MemoryCartStore {
    ttl;
    carts = new Map();
    timers = new Map();
    constructor(ttl) {
        this.ttl = ttl;
    }
    async createCart() {
        const id = crypto_1.default.randomUUID();
        await this.setCart(id, {});
        return id;
    }
    async getCart(id) {
        const entry = this.carts.get(id);
        if (!entry)
            return {};
        if (entry.expires < Date.now()) {
            this.carts.delete(id);
            return {};
        }
        return entry.cart;
    }
    async setCart(id, cart) {
        this.carts.set(id, { cart, expires: Date.now() + this.ttl * 1000 });
        this.resetTimer(id);
    }
    async deleteCart(id) {
        this.carts.delete(id);
    }
    async incrementQty(id, sku, qty, size, rental) {
        let entry = this.carts.get(id);
        if (!entry || entry.expires < Date.now()) {
            entry = { cart: {}, expires: Date.now() };
            this.carts.set(id, entry);
        }
        const key = size ? `${sku.id}:${size}` : sku.id;
        const line = entry.cart[key];
        entry.cart[key] = { sku, size, qty: (line?.qty ?? 0) + qty, rental: rental ?? line?.rental };
        entry.expires = Date.now() + this.ttl * 1000;
        this.resetTimer(id);
        return entry.cart;
    }
    async setQty(id, skuId, qty) {
        const entry = this.carts.get(id);
        if (!entry || entry.expires < Date.now()) {
            this.carts.delete(id);
            return null;
        }
        const line = entry.cart[skuId];
        if (!line)
            return null;
        if (qty === 0) {
            delete entry.cart[skuId];
        }
        else {
            entry.cart[skuId] = { ...line, qty };
        }
        entry.expires = Date.now() + this.ttl * 1000;
        this.resetTimer(id);
        return entry.cart;
    }
    async removeItem(id, skuId) {
        const entry = this.carts.get(id);
        if (!entry || entry.expires < Date.now()) {
            this.carts.delete(id);
            return null;
        }
        if (!(skuId in entry.cart))
            return null;
        delete entry.cart[skuId];
        entry.expires = Date.now() + this.ttl * 1000;
        this.resetTimer(id);
        return entry.cart;
    }
    resetTimer(id) {
        const existing = this.timers.get(id);
        if (existing)
            clearTimeout(existing);
        // Schedule deletion so Jest fake timers can advance and trigger expiry deterministically.
        // Clamp to the maximum 32-bit signed integer to avoid Node's TimeoutOverflowWarning when
        // very long TTLs are configured (e.g. 30 days in milliseconds).
        const delayMs = Math.min(this.ttl * 1000, 2_147_483_647);
        const handle = setTimeout(() => {
            this.carts.delete(id);
            this.timers.delete(id);
        }, delayMs);
        this.timers.set(id, handle);
    }
}
exports.MemoryCartStore = MemoryCartStore;
