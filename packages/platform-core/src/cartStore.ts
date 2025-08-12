import crypto from "crypto";
import { Redis } from "@upstash/redis";

import { coreEnv } from "@acme/config/env/core";
import type { CartState } from "./cartCookie";
import type { SKU } from "@acme/types";

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

// Default cart expiration is 30 days (in seconds)
const TTL_SECONDS = Number(coreEnv.CART_TTL ?? 60 * 60 * 24 * 30);
const MAX_REDIS_FAILURES = 3;

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

  async incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string
  ): Promise<CartState> {
    let entry = this.carts.get(id);
    if (!entry || entry.expires < Date.now()) {
      entry = { cart: {}, expires: Date.now() };
      this.carts.set(id, entry);
    }
    const key = size ? `${sku.id}:${size}` : sku.id;
    const line = entry.cart[key];
    entry.cart[key] = { sku, size, qty: (line?.qty ?? 0) + qty };
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

const memoryStore = new MemoryCartStore(TTL_SECONDS);

let store: CartStore = memoryStore;

class RedisCartStore implements CartStore {
  private failures = 0;

  constructor(
    private client: Redis,
    private ttl: number
  ) {}

  private async exec<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (err) {
      console.error("Redis operation failed", err);
      this.failures += 1;
      if (this.failures >= MAX_REDIS_FAILURES) {
        console.error(
          "Falling back to MemoryCartStore after repeated Redis failures"
        );
        store = memoryStore;
      }
      return undefined;
    }
  }

  private skuKey(id: string) {
    return `${id}:sku`;
  }

  async createCart(): Promise<string> {
    const id = crypto.randomUUID();
    const ok1 = await this.exec(() => this.client.hset(id, {}));
    const ok2 = await this.exec(() => this.client.expire(id, this.ttl));
    if (ok1 === undefined || ok2 === undefined) {
      return memoryStore.createCart();
    }
    return id;
  }

  async getCart(id: string): Promise<CartState> {
    const qty = await this.exec(() => this.client.hgetall<number>(id));
    const lines = await this.exec(() =>
      this.client.hgetall<string>(this.skuKey(id))
    );
    if (!qty || !lines) {
      return memoryStore.getCart(id);
    }
    const cart: CartState = {};
    for (const [lineId, q] of Object.entries(qty)) {
      const lineJson = lines[lineId];
      if (!lineJson) continue;
      const parsed = JSON.parse(lineJson) as {
        sku: SKU;
        size?: string;
      };
      cart[lineId] = { sku: parsed.sku, size: parsed.size, qty: Number(q) };
    }
    return cart;
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    const qty: Record<string, number> = {};
    const lines: Record<string, string> = {};
    for (const [lineId, line] of Object.entries(cart)) {
      qty[lineId] = line.qty;
      lines[lineId] = JSON.stringify({ sku: line.sku, size: line.size });
    }
    let ok = true;
    if ((await this.exec(() => this.client.del(id))) === undefined) ok = false;
    if ((await this.exec(() => this.client.del(this.skuKey(id)))) === undefined)
      ok = false;
    if (Object.keys(qty).length) {
      if ((await this.exec(() => this.client.hset(id, qty))) === undefined)
        ok = false;
      if (
        (await this.exec(() => this.client.hset(this.skuKey(id), lines))) ===
        undefined
      )
        ok = false;
    }
    if ((await this.exec(() => this.client.expire(id, this.ttl))) === undefined)
      ok = false;
    if (
      (await this.exec(() => this.client.expire(this.skuKey(id), this.ttl))) ===
      undefined
    )
      ok = false;
    if (!ok) {
      await memoryStore.setCart(id, cart);
    }
  }

  async deleteCart(id: string): Promise<void> {
    let ok = true;
    if ((await this.exec(() => this.client.del(id))) === undefined) ok = false;
    if ((await this.exec(() => this.client.del(this.skuKey(id)))) === undefined)
      ok = false;
    if (!ok) {
      await memoryStore.deleteCart(id);
    }
  }

  async incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string
  ): Promise<CartState> {
    const key = size ? `${sku.id}:${size}` : sku.id;
    let ok = true;
    if (
      (await this.exec(() => this.client.hincrby(id, key, qty))) === undefined
    )
      ok = false;
    if (
      (await this.exec(() =>
        this.client.hset(this.skuKey(id), {
          [key]: JSON.stringify({ sku, size }),
        })
      )) === undefined
    )
      ok = false;
    if ((await this.exec(() => this.client.expire(id, this.ttl))) === undefined)
      ok = false;
    if (
      (await this.exec(() => this.client.expire(this.skuKey(id), this.ttl))) ===
      undefined
    )
      ok = false;
    if (!ok) {
      return memoryStore.incrementQty(id, sku, qty, size);
    }
    return this.getCart(id);
  }

  async setQty(
    id: string,
    skuId: string,
    qty: number
  ): Promise<CartState | null> {
    const exists = await this.exec(() => this.client.hexists(id, skuId));
    if (exists === undefined) {
      return memoryStore.setQty(id, skuId, qty);
    }
    if (!exists) return null;
    let ok = true;
    if (qty === 0) {
      if ((await this.exec(() => this.client.hdel(id, skuId))) === undefined)
        ok = false;
      if (
        (await this.exec(() => this.client.hdel(this.skuKey(id), skuId))) ===
        undefined
      )
        ok = false;
    } else {
      if (
        (await this.exec(() => this.client.hset(id, { [skuId]: qty }))) ===
        undefined
      )
        ok = false;
    }
    if ((await this.exec(() => this.client.expire(id, this.ttl))) === undefined)
      ok = false;
    if (
      (await this.exec(() => this.client.expire(this.skuKey(id), this.ttl))) ===
      undefined
    )
      ok = false;
    if (!ok) {
      return memoryStore.setQty(id, skuId, qty);
    }
    return this.getCart(id);
  }

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const removed = await this.exec(() => this.client.hdel(id, skuId));
    if (removed === undefined) {
      return memoryStore.removeItem(id, skuId);
    }
    if (removed === 0) return null;
    let ok = true;
    if (
      (await this.exec(() => this.client.hdel(this.skuKey(id), skuId))) ===
      undefined
    )
      ok = false;
    if ((await this.exec(() => this.client.expire(id, this.ttl))) === undefined)
      ok = false;
    if (
      (await this.exec(() => this.client.expire(this.skuKey(id), this.ttl))) ===
      undefined
    )
      ok = false;
    if (!ok) {
      return memoryStore.removeItem(id, skuId);
    }
    return this.getCart(id);
  }
}
if (
  coreEnv.UPSTASH_REDIS_REST_URL &&
  coreEnv.UPSTASH_REDIS_REST_TOKEN
) {
  const client = new Redis({
    url: coreEnv.UPSTASH_REDIS_REST_URL,
    token: coreEnv.UPSTASH_REDIS_REST_TOKEN,
  });
  store = new RedisCartStore(client, TTL_SECONDS);
}

export const createCart = () => store.createCart();
export const getCart = (id: string) => store.getCart(id);
export const setCart = (id: string, cart: CartState) => store.setCart(id, cart);
export const deleteCart = (id: string) => store.deleteCart(id);
export const incrementQty = (
  id: string,
  sku: SKU,
  qty: number,
  size?: string
) => store.incrementQty(id, sku, qty, size);
export const setQty = (id: string, skuId: string, qty: number) =>
  store.setQty(id, skuId, qty);
export const removeItem = (id: string, skuId: string) =>
  store.removeItem(id, skuId);
