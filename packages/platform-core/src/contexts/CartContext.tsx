// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import { type CartState } from "../cartCookie";

import type { SKU } from "@types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

/* ------------------------------------------------------------------
 * Action types
 * ------------------------------------------------------------------ */
type Action =
  | { type: "add"; sku: SKU; size?: string }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number };

/* ------------------------------------------------------------------
 * React context
 * ------------------------------------------------------------------ */
type Dispatch = (action: Action) => Promise<void>;

const CartContext = createContext<[CartState, Dispatch] | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  /* initial fetch */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setState(data.cart as CartState);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
  }, []);

  const dispatch: Dispatch = async (action) => {
    let method: string;
    let body: unknown;
    switch (action.type) {
      case "add":
        method = "POST";
        body = { sku: action.sku, qty: 1, size: action.size };
        break;
      case "remove":
        method = "DELETE";
        body = { id: action.id };
        break;
      case "setQty":
        method = "PATCH";
        body = { id: action.id, qty: action.qty };
        break;
      default:
        return;
    }

    const res = await fetch("/api/cart", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Cart update failed");
    }

    const data = await res.json();
    setState(data.cart as CartState);
  };

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
