import crypto from "crypto";
import type { Redis } from "@upstash/redis";

import type { CartState } from "../cartCookie";
import type { SKU } from "@acme/types";
import type { CartStore } from "../cartStore";

const MAX_REDIS_FAILURES = 3;

/** Redis-backed implementation of CartStore */
export class RedisCartStore implements CartStore {
  private failures = 0;
  private fallbackMode = false;

  constructor(
    private client: Redis,
    private ttl: number,
    private fallback: CartStore
  ) {}

  private async exec<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (this.fallbackMode) return undefined;
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
        this.fallbackMode = true;
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
      return this.fallback.createCart();
    }
    return id;
  }

  async getCart(id: string): Promise<CartState> {
    const qty = await this.exec(() =>
      this.client.hgetall<Record<string, number>>(id)
    );
    const lines = await this.exec(() =>
      this.client.hgetall<Record<string, string>>(this.skuKey(id))
    );
    if (!qty || !lines) {
      return this.fallback.getCart(id);
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
      await this.fallback.setCart(id, cart);
    }
  }

  async deleteCart(id: string): Promise<void> {
    let ok = true;
    if ((await this.exec(() => this.client.del(id))) === undefined) ok = false;
    if ((await this.exec(() => this.client.del(this.skuKey(id)))) === undefined)
      ok = false;
    if (!ok) {
      await this.fallback.deleteCart(id);
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
      return this.fallback.incrementQty(id, sku, qty, size);
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
      return this.fallback.setQty(id, skuId, qty);
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
      return this.fallback.setQty(id, skuId, qty);
    }
    return this.getCart(id);
  }

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const removed = await this.exec(() => this.client.hdel(id, skuId));
    if (removed === undefined) {
      return this.fallback.removeItem(id, skuId);
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
      return this.fallback.removeItem(id, skuId);
    }
    return this.getCart(id);
  }
}

