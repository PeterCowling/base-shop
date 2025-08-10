// packages/platform-core/src/cartStore.ts
import type { CartState } from "./cartCookie";

const store = new Map<string, CartState>();

export function getCart(id: string): CartState {
  return store.get(id) ?? {};
}

export function setCart(id: string, cart: CartState): void {
  store.set(id, cart);
}
