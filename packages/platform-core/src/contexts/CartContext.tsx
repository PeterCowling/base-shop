// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import { type CartState } from "../cartCookie";

import type { SKU } from "@types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

/* ------------------------------------------------------------------
 * Action types
 * ------------------------------------------------------------------ */
type Action =
  | { type: "add"; sku: SKU; size?: string }
  | { type: "remove"; id: SKU["id"] }
  | { type: "setQty"; id: SKU["id"]; qty: number };

/* ------------------------------------------------------------------
 * React context
 * ------------------------------------------------------------------ */
const CartContext = createContext<
  [CartState, (action: Action) => Promise<void>] | undefined
>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = (await res.json()) as { cart: CartState };
          setState(data.cart);
        }
      } catch {
        /* ignore */
      }
    }
    init();
  }, []);

  async function dispatch(action: Action) {
    let res: Response | undefined;
    try {
      switch (action.type) {
        case "add":
          res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku: action.sku, qty: 1 }),
          });
          break;
        case "remove":
          res = await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: action.id }),
          });
          break;
        case "setQty":
          res = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: action.id, qty: action.qty }),
          });
          break;
      }
      if (res && res.ok) {
        const data = (await res.json()) as { cart: CartState };
        setState(data.cart);
      } else {
        const data = (await res?.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Request failed");
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error("Request failed");
    }
  }

  return (
    <CartContext.Provider value={[state, dispatch]}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
