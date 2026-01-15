import crypto from "crypto";
import type { CartState, CartLine } from "../cart";
import type { SKU, RentalLineItem } from "@acme/types";
import type { CartStore } from "../cartStore";

// Minimal Durable Object type surface to avoid depending on Cloudflare types
export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

type DORequest =
  | { op: "init"; ttl: number }
  | { op: "get"; ttl: number }
  | { op: "set"; cart: CartState; ttl: number }
  | {
      op: "increment";
      sku: SKU;
      qty: number;
      size?: string;
      rental?: RentalLineItem;
      ttl: number;
    }
  | { op: "setQty"; skuId: string; qty: number; ttl: number }
  | { op: "remove"; skuId: string; ttl: number };

type DOResponse =
  | { ok: true; cart?: CartState }
  | { ok: false; cart?: CartState };

type StoredCart = { cart: CartState; expiresAt: number };

const CART_KEY = "cart";

/** Cloudflare Durable Object-backed implementation of CartStore */
export class CloudflareDurableObjectCartStore implements CartStore {
  constructor(
    private namespace: DurableObjectNamespace,
    private ttl: number,
    private fallback: CartStore
  ) {}

  private stub(id: string): DurableObjectStub {
    return this.namespace.get(this.namespace.idFromName(id));
  }

  private async call<T = DOResponse>(
    id: string,
    body: DORequest
  ): Promise<T | undefined> {
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
      if (!res.ok) return undefined;
      return (await res.json()) as T;
    } catch (err) {
      console.warn("Cart DO call failed", err); // i18n-exempt -- internal diagnostic log
      return undefined;
    }
  }

  async createCart(): Promise<string> {
    const id = crypto.randomUUID();
    const result = await this.call<DOResponse>(id, { op: "init", ttl: this.ttl });
    if (result?.ok) return id;
    return this.fallback.createCart();
  }

  async getCart(id: string): Promise<CartState> {
    const result = await this.call<DOResponse>(id, { op: "get", ttl: this.ttl });
    if (result?.ok && result.cart) return result.cart;
    return this.fallback.getCart(id);
  }

  async setCart(id: string, cart: CartState): Promise<void> {
    const result = await this.call<DOResponse>(id, { op: "set", cart, ttl: this.ttl });
    if (!result?.ok) {
      await this.fallback.setCart(id, cart);
    }
  }

  async deleteCart(id: string): Promise<void> {
    // Removing a cart is equivalent to clearing it
    const result = await this.call<DOResponse>(id, { op: "set", cart: {}, ttl: this.ttl });
    if (!result?.ok) {
      await this.fallback.deleteCart(id);
    }
  }

  async incrementQty(
    id: string,
    sku: SKU,
    qty: number,
    size?: string,
    rental?: RentalLineItem
  ): Promise<CartState> {
    const result = await this.call<DOResponse>(id, {
      op: "increment",
      sku,
      qty,
      size,
      rental,
      ttl: this.ttl,
    });
    if (result?.ok && result.cart) return result.cart;
    return this.fallback.incrementQty(id, sku, qty, size, rental);
  }

  async setQty(id: string, skuId: string, qty: number): Promise<CartState | null> {
    const result = await this.call<DOResponse>(id, {
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

  async removeItem(id: string, skuId: string): Promise<CartState | null> {
    const result = await this.call<DOResponse>(id, {
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

/** Durable Object implementation (to be bound via wrangler.toml as CART_DO) */
export class CartDurableObject {
  constructor(private state: DurableObjectState) {}

  private async load(): Promise<StoredCart | null> {
    const stored = await this.state.storage.get<StoredCart>(CART_KEY);
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      await this.state.storage.delete(CART_KEY);
      return null;
    }
    return stored;
  }

  private async save(cart: CartState, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    await this.state.storage.put(CART_KEY, { cart, expiresAt });
  }

  private upsertLine(
    cart: CartState,
    sku: SKU,
    qty: number,
    size?: string,
    rental?: RentalLineItem
  ): CartState {
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

  private setQty(cart: CartState, skuId: string, qty: number): CartState {
    const updated = { ...cart };
    if (qty <= 0) {
      delete updated[skuId];
      return updated;
    }
    const existing = updated[skuId];
    if (!existing) return cart;
    updated[skuId] = { ...existing, qty };
    return updated;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as DORequest;
      const stored = (await this.load()) ?? { cart: {} as CartState, expiresAt: 0 };
      let cart: CartState = stored.cart;

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
    } catch (err) {
      console.error("CartDurableObject error", err); // i18n-exempt -- internal diagnostic log
      return json({ ok: false }, 500);
    }
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function shouldLogLatency(): boolean {
  // Avoid noisy logs in tests; process is undefined in Workers
  return !(
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test"
  );
}
