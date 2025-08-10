// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import { type CartState } from "../cartCookie";
import type { SKU } from "@types";
import {
  createContext,
  ReactNode,
  useCallback,
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
type Dispatch = (action: Action) => Promise<{ ok: boolean; error?: string }>;

const CartContext = createContext<[CartState, Dispatch] | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  /* hydrate cart from server */
  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setState((data as { cart?: CartState }).cart ?? {}))
      .catch(() => setState({}));
  }, []);

  const dispatch: Dispatch = useCallback(async (action) => {
    let res: Response;
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
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: action.id, qty: 0 }),
        });
        break;
      case "setQty":
        res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: action.id, qty: action.qty }),
        });
        break;
      default:
        return { ok: false };
    }

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setState((data as { cart?: CartState }).cart ?? {});
    }
    return { ok: res.ok, error: (data as { error?: string }).error };
  }, []);

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
