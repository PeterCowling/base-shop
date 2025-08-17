// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import { type CartState } from "../cartCookie";

import type { SKU } from "@acme/types";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------
 * Action types
 * ------------------------------------------------------------------ */
type Action =
  | { type: "add"; sku: SKU; size?: string; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number };

/* ------------------------------------------------------------------
 * React context
 * ------------------------------------------------------------------ */
type Dispatch = (action: Action) => Promise<void>;

const CartContext = createContext<[CartState, Dispatch] | undefined>(undefined);

const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  /* initial fetch */
  useEffect(() => {
    let sync: (() => Promise<void>) | undefined;

    async function load() {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const data = await res.json();
          setState(data.cart as CartState);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
          } catch {
            /* noop */
          }
          return;
        }
        throw new Error("Cart fetch failed");
      } catch (err) {
        console.error(err);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            setState(JSON.parse(cached) as CartState);
          }
        } catch {
          /* noop */
        }

        sync = async () => {
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (!cached) return;
            const cart = JSON.parse(cached) as CartState;
            const res = await fetch("/api/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lines: Object.values(cart).map((line) => ({
                  sku: { id: line.sku.id },
                  qty: line.qty,
                  size: line.size,
                })),
              }),
            });
            if (res.ok) {
              const data = await res.json();
              setState(data.cart as CartState);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
              window.removeEventListener("online", sync!);
            }
          } catch (err) {
            console.error(err);
          }
        };

        window.addEventListener("online", sync);
      }
    }

    void load();

    return () => {
      if (sync) window.removeEventListener("online", sync);
    };
  }, []);

  const dispatch: Dispatch = async (action) => {
    let method: string;
    let body: unknown;
    switch (action.type) {
      case "add":
        if (action.sku.sizes.length && !action.size) {
          throw new Error("Size is required");
        }
        method = "POST";
        body = {
          sku: { id: action.sku.id },
          qty: action.qty ?? 1,
          size: action.size,
        };
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
    } catch {
      /* noop */
    }
  };

  return (
    <CartContext.Provider value={[state, dispatch]}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): [CartState, Dispatch] {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
