import crypto from "crypto";

import type { CartState } from "./cartCookie";

// Simple in-memory cart storage keyed by cart ID.
const carts = new Map<string, CartState>();

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
