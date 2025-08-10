import { randomUUID } from "crypto";
import type { CartState } from "./cartCookie";

/** In-memory cart storage keyed by ID. */
const store = new Map<string, CartState>();

/** Create a new cart and return its ID. */
export function createCart(initial: CartState = {}): string {
  const id = randomUUID();
  store.set(id, initial);
  return id;
}

/** Retrieve cart by ID. Returns empty cart if not found. */
export function getCart(id: string): CartState {
  return store.get(id) ?? {};
}

/** Persist cart state under given ID. */
export function setCart(id: string, cart: CartState): void {
  store.set(id, cart);
}
