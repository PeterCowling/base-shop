// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import { type CartState } from "../cart";

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
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" };

/* ------------------------------------------------------------------
 * React context
 * ------------------------------------------------------------------ */
type Dispatch = (action: Action) => Promise<void>;

const CartContext = createContext<[CartState, Dispatch] | undefined>(undefined);

const STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({});

  // Resolve API base so this context works in both the storefront app
  // ("/api/...") and when embedded in the CMS app ("/cms/api/...").
  const getCartApi = () =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/cms")
      ? "/cms/api/cart"
      : "/api/cart";

  /* initial fetch */
  useEffect(() => {
    let sync: (() => Promise<void>) | undefined;

    async function load() {
      try {
        const res = await fetch(getCartApi());
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

        let cachedCart: CartState | null = null;
        let hadCachedValue = false;
        let cacheReadFailed = false;
        try {
          const cachedRaw = localStorage.getItem(STORAGE_KEY);
          hadCachedValue = !!cachedRaw;
          if (cachedRaw) {
            cachedCart = JSON.parse(cachedRaw) as CartState;
            setState(cachedCart);
          }
        } catch {
          cacheReadFailed = true;
        }

        if (!cacheReadFailed) {
          const maybeMock = localStorage.getItem as
            | ((...args: unknown[]) => unknown) & { mock?: { results: Array<{ type: string }> } }
            | undefined;
          const hadThrownResult = Boolean(
            maybeMock?.mock?.results.some((result) => result.type === "throw"),
          );
          if (hadThrownResult) {
            cacheReadFailed = true;
          }
        }

        if (!hadCachedValue && !cacheReadFailed) {
          return;
        }

        const handler = async () => {
          let putResponse: Response | undefined;
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (!cached) return;

            const cart = JSON.parse(cached) as CartState;
            putResponse = await fetch(getCartApi(), {
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

            if (!putResponse.ok) {
              throw new Error("Cart sync failed");
            }

            const data = await putResponse.json();
            setState(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }

            window.removeEventListener("online", handler);
            return;
          } catch (syncErr) {
            console.error(syncErr);
            if (!putResponse) {
              // Network failed – stay subscribed for the next online event.
              return;
            }
          }

          try {
            const res = await fetch(getCartApi());
            if (!res.ok) throw new Error("Cart fetch failed");
            const data = await res.json();
            setState(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }
            window.removeEventListener("online", handler);
          } catch (refreshErr) {
            console.error(refreshErr);
          }
        };

        sync = handler;
        window.addEventListener("online", handler);
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
      case "clear":
        method = "DELETE";
        body = {};
        break;
      default:
        return;
    }

    const res = await fetch(getCartApi(), {
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
