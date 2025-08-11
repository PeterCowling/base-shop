import crypto from "crypto";
import { Redis } from "@upstash/redis";

import type { CartState } from "./cartCookie";
import type { SKU } from "@types";

/** Abstraction for cart storage backends */
export interface CartStore {
  createCart(): Promise<string>;
  getCart(id: string): Promise<CartState>;
  setCart(id: string, cart: CartState): Promise<void>;
  deleteCart(id: string): Promise<void>;
  incrementQty(id: string, sku: SKU, qty: number): Promise<CartState>;
  setQty(id: string, skuId: string, qty: number): Promise<CartState | null>;
  removeItem(id: string, skuId: string): Promise<CartState | null>;
}

const TTL_SECONDS = Number(process.env.CART_TTL ?? 60 * 60 * 24);

class MemoryCartStore implements CartStore {
  private carts = new Map<string, { cart: CartState; expires: number }>();

  constructor(private ttl: number) {}

  async createCart(): Promise<string> {
    const id = crypto.randomUUID();
    await this.setCart(id, {});
    return id;
  }

  async getCart(id: string): Promise<CartState> {
    const entry = this.carts.get(id);
    if (!entry) return {};
    if (entry.expires < Date.now()) {
      this.carts.delete(id);
      return {};
    }
    return entry.cart;
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    this.carts.set(id, { cart, expires: Date.now() + this.ttl * 1000 });
  }

  async deleteCart(id: string): Promise<void> {
    this.carts.delete(id);
  }

  async incrementQty(id: string, sku: SKU, qty: number): Promise<CartState> {
    let entry = this.carts.get(id);
    if (!entry || entry.expires < Date.now()) {
      entry = { cart: {}, expires: Date.now() };
      this.carts.set(id, entry);
    }
    const line = entry.cart[sku.id];
    entry.cart[sku.id] = { sku, qty: (line?.qty ?? 0) + qty };
    entry.expires = Date.now() + this.ttl * 1000;
    return entry.cart;
  }

  async setQty(
    id: string,
    skuId: string,
    qty: number
  ): Promise<CartState | null> {
    const entry = this.carts.get(id);
    if (!entry || entry.expires < Date.now()) {
      this.carts.delete(id);
      return null;
    }
    const line = entry.cart[skuId];
    if (!line) return null;
    if (qty === 0) {
      delete entry.cart[skuId];
    } else {
      entry.cart[skuId] = { ...line, qty };
    }
    entry.expires = Date.now() + this.ttl * 1000;
    return entry.cart;
  }

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const entry = this.carts.get(id);
    if (!entry || entry.expires < Date.now()) {
      this.carts.delete(id);
      return null;
    }
    if (!(skuId in entry.cart)) return null;
    delete entry.cart[skuId];
    entry.expires = Date.now() + this.ttl * 1000;
    return entry.cart;
  }
}

class RedisCartStore implements CartStore {
  constructor(private client: Redis, private ttl: number) {}

  private skuKey(id: string) {
    return `${id}:sku`;
  }

  async createCart(): Promise<string> {
    const id = crypto.randomUUID();
    await this.client.hset(id, {});
    await this.client.expire(id, this.ttl);
    return id;
  }

  async getCart(id: string): Promise<CartState> {
    const qty = (await this.client.hgetall<number>(id)) || {};
    const skus = (await this.client.hgetall<string>(this.skuKey(id))) || {};
    const cart: CartState = {};
    for (const [skuId, q] of Object.entries(qty)) {
      const skuJson = skus[skuId];
      if (!skuJson) continue;
      cart[skuId] = { sku: JSON.parse(skuJson), qty: Number(q) };
    }
    return cart;
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    const qty: Record<string, number> = {};
    const skus: Record<string, string> = {};
    for (const [skuId, line] of Object.entries(cart)) {
      qty[skuId] = line.qty;
      skus[skuId] = JSON.stringify(line.sku);
    }
    await this.client.del(id);
    await this.client.del(this.skuKey(id));
    if (Object.keys(qty).length) {
      await this.client.hset(id, qty);
      await this.client.hset(this.skuKey(id), skus);
    }
    await this.client.expire(id, this.ttl);
    await this.client.expire(this.skuKey(id), this.ttl);
  }

  async deleteCart(id: string): Promise<void> {
    await this.client.del(id);
    await this.client.del(this.skuKey(id));
  }

  async incrementQty(id: string, sku: SKU, qty: number): Promise<CartState> {
    await this.client.hincrby(id, sku.id, qty);
    await this.client.hset(this.skuKey(id), { [sku.id]: JSON.stringify(sku) });
    await this.client.expire(id, this.ttl);
    await this.client.expire(this.skuKey(id), this.ttl);
    return this.getCart(id);
  }

  async setQty(
    id: string,
    skuId: string,
    qty: number
  ): Promise<CartState | null> {
    const exists = await this.client.hexists(id, skuId);
    if (!exists) return null;
    if (qty === 0) {
      await this.client.hdel(id, skuId);
      await this.client.hdel(this.skuKey(id), skuId);
    } else {
      await this.client.hset(id, { [skuId]: qty });
    }
    await this.client.expire(id, this.ttl);
    await this.client.expire(this.skuKey(id), this.ttl);
    return this.getCart(id);
  }

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const removed = await this.client.hdel(id, skuId);
    if (removed === 0) return null;
    await this.client.hdel(this.skuKey(id), skuId);
    await this.client.expire(id, this.ttl);
    await this.client.expire(this.skuKey(id), this.ttl);
    return this.getCart(id);
  }
}

let store: CartStore;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  store = new RedisCartStore(client, TTL_SECONDS);
} else {
  store = new MemoryCartStore(TTL_SECONDS);
}

export const createCart = () => store.createCart();
export const getCart = (id: string) => store.getCart(id);
export const setCart = (id: string, cart: CartState) =>
  store.setCart(id, cart);
export const deleteCart = (id: string) => store.deleteCart(id);
export const incrementQty = (id: string, sku: SKU, qty: number) =>
  store.incrementQty(id, sku, qty);
export const setQty = (id: string, skuId: string, qty: number) =>
  store.setQty(id, skuId, qty);
export const removeItem = (id: string, skuId: string) =>
  store.removeItem(id, skuId);

