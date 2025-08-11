import crypto from "crypto";
import { Redis } from "@upstash/redis";

import type { CartState } from "./cartCookie";

/** Abstraction for cart storage backends */
export interface CartStore {
  createCart(): Promise<string>;
  getCart(id: string): Promise<CartState>;
  setCart(id: string, cart: CartState): Promise<void>;
  deleteCart(id: string): Promise<void>;
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
}

class RedisCartStore implements CartStore {
  constructor(private client: Redis, private ttl: number) {}

  async createCart(): Promise<string> {
    const id = crypto.randomUUID();
    await this.client.set(id, {}, { ex: this.ttl });
    return id;
  }

  async getCart(id: string): Promise<CartState> {
    return ((await this.client.get(id)) as CartState) ?? {};
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    await this.client.set(id, cart, { ex: this.ttl });
  }

  async deleteCart(id: string): Promise<void> {
    await this.client.del(id);
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

