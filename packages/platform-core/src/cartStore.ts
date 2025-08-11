import crypto from "crypto";

import type { CartState } from "./cartCookie";

// Simple in-memory cart storage keyed by cart ID.
const carts = new Map<string, CartState>();

/** Build a unique key for a cart line from SKU ID and optional size. */
export function lineKey(skuId: string, size?: string): string {
  return size ? `${skuId}:${size}` : skuId;
}

/** Parse a cart line key back into its SKU ID and optional size. */
export function parseLineKey(key: string): { skuId: string; size?: string } {
  const [skuId, size] = key.split(":");
  return size ? { skuId, size } : { skuId };
}

/** Create a new empty cart and return its ID. */
export function createCart(): string {
  const id = crypto.randomUUID();
  carts.set(id, {});
  return id;
}

/** Retrieve cart by ID, returning empty object if not found. */
export function getCart(id: string): CartState {
  return carts.get(id) ?? {};
}

/** Replace cart contents for given ID. */
export function setCart(id: string, cart: CartState): void {
  carts.set(id, cart);
}

/** Remove cart from storage. */
export function deleteCart(id: string): void {
  carts.delete(id);
}
