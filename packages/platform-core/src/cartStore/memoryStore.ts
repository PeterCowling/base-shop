import crypto from "crypto";

import type { CartState } from "../cart";
import type { SKU, RentalLineItem } from "@acme/types";
import type { CartStore } from "../cartStore";

/** In-memory implementation of CartStore */
export class MemoryCartStore implements CartStore {
  private carts = new Map<string, { cart: CartState; expires: number }>();
  private timers = new Map<string, NodeJS.Timeout>();

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
    this.resetTimer(id);
  }

  async deleteCart(id: string): Promise<void> {
    this.carts.delete(id);
  }

  async incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string,
    rental?: RentalLineItem
  ): Promise<CartState> {
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
    this.resetTimer(id);
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
    this.resetTimer(id);
    return entry.cart;
  }

  private resetTimer(id: string) {
    const existing = this.timers.get(id);
    if (existing) clearTimeout(existing);
    // Schedule deletion so Jest fake timers can advance and trigger expiry deterministically
    const handle = setTimeout(() => {
      this.carts.delete(id);
      this.timers.delete(id);
    }, this.ttl * 1000);
    this.timers.set(id, handle);
  }
}
