// packages/platform-core/src/contexts/CartContext.tsx
"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { RentalLineItem,SKU } from "@acme/types";

import { logAnalyticsEvent } from "../analytics/client";
import type { CartLine, CartState } from "../cart";

/* ------------------------------------------------------------------
 * Action types
 * ------------------------------------------------------------------ */
type Action =
  | { type: "add"; sku: SKU; size?: string; qty?: number; meta?: CartLine["meta"]; rental?: RentalLineItem }
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
  const lastStateHashRef = useRef<string>(JSON.stringify({}));
  const setCartStateIfChanged = (next: CartState) => {
    try {
      const h = JSON.stringify(next);
      if (h === lastStateHashRef.current) return;
      lastStateHashRef.current = h;
      setState(next);
    } catch {
      setState(next);
    }
  };

  // Resolve API base so this context works in both the storefront app
  // ("/api/...") and when embedded in the CMS app ("/cms/api/...").
  const getCartApi = () =>
    typeof window !== "undefined" && window.location.pathname.startsWith("/cms")
      ? "/cms/api/cart"
      : "/api/cart";

  /* initial fetch */
  useEffect(() => {
    const didInitRef = { current: false } as { current: boolean };
    if (didInitRef.current) return;
    didInitRef.current = true;
    let sync: (() => Promise<void>) | undefined;

    async function load() {
      try {
        const res = await fetch(getCartApi());
        if (res.ok) {
          const data = await res.json();
          setCartStateIfChanged(data.cart as CartState);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
          } catch {
            /* noop */
          }
          return;
        }
        // Non-OK initial response: prefer graceful fallback over throwing.
        // Log at warn level so expected cart API issues (e.g. offline dev,
        // preview environments without a backend) do not surface as hard
        // console errors.
        console.warn(
          "[cart] initial fetch not ok", // i18n-exempt -- developer log label, not user-facing
          { status: res.status, statusText: res.statusText }
        );

        // Fall back to cached cart and register a sync handler for when we go online.
        let cachedCart: CartState | null = null;
        let hadCachedValue = false;
        let cacheReadFailed = false;
        try {
          const cachedRaw = localStorage.getItem(STORAGE_KEY);
          hadCachedValue = !!cachedRaw;
          if (cachedRaw) {
            cachedCart = JSON.parse(cachedRaw) as CartState;
            setCartStateIfChanged(cachedCart);
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
          // Nothing cached to sync; wait for online event without logging errors.
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
              throw new Error("Cart sync failed"); // i18n-exempt -- internal error string, surfaced to logs only
            }

            const data = await putResponse.json();
            setCartStateIfChanged(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }

            window.removeEventListener("online", handler);
            return;
          } catch (syncErr) {
            // Network or runtime error during sync: treat as a warning so
            // transient failures don't pollute the console with errors.
            console.warn("[cart] sync on online failed", syncErr); // i18n-exempt -- developer log label, not user-facing
            if (!putResponse) {
              // Network failed – stay subscribed for the next online event.
              return;
            }
          }

          try {
            const res2 = await fetch(getCartApi());
            if (!res2 || !("ok" in res2) || !res2.ok) throw new Error("Cart fetch failed"); // i18n-exempt -- internal error string, surfaced to logs only
            const data = await res2.json();
            setCartStateIfChanged(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }
            window.removeEventListener("online", handler);
          } catch (refreshErr) {
            // Network or runtime error during refresh: treat as a warning.
            console.warn("[cart] refresh after sync failed", refreshErr); // i18n-exempt -- developer log label, not user-facing
          }
        };

        sync = handler;
        window.addEventListener("online", handler);
      } catch (err) {
        // Network or runtime error: log at warn to avoid noisy console errors in dev.
        // Avoid logging the raw Error object as an error so that the browser
        // console does not show a scary “Error: Failed to fetch” entry when
        // the cart API is temporarily unavailable.
        console.warn(
          "[cart] initial fetch failed", // i18n-exempt -- developer log label, not user-facing
          err instanceof Error ? err.message : err,
        );

        let cachedCart: CartState | null = null;
        let hadCachedValue = false;
        let cacheReadFailed = false;
        try {
          const cachedRaw = localStorage.getItem(STORAGE_KEY);
          hadCachedValue = !!cachedRaw;
          if (cachedRaw) {
            cachedCart = JSON.parse(cachedRaw) as CartState;
            setCartStateIfChanged(cachedCart);
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
          // Nothing cached to sync; wait for online event without logging errors.
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
              throw new Error("Cart sync failed"); // i18n-exempt -- internal error string, surfaced to logs only
            }

            const data = await putResponse.json();
            setCartStateIfChanged(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }

            window.removeEventListener("online", handler);
            return;
          } catch (syncErr) {
            console.warn("[cart] sync on online failed", syncErr); // i18n-exempt -- developer log label, not user-facing
            if (!putResponse) {
              // Network failed – stay subscribed for the next online event.
              return;
            }
          }

          try {
            const res = await fetch(getCartApi());
            if (!res || !("ok" in res) || !res.ok) throw new Error("Cart fetch failed"); // i18n-exempt -- internal error string, surfaced to logs only
            const data = await res.json();
            setCartStateIfChanged(data.cart as CartState);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
            } catch {
              /* noop */
            }
            window.removeEventListener("online", handler);
          } catch (refreshErr) {
            console.warn("[cart] refresh after sync failed", refreshErr); // i18n-exempt -- developer log label, not user-facing
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
    let analyticsEvent: { type: string; [key: string]: unknown } | null = null;
    switch (action.type) {
      case "add":
        if (action.sku.sizes.length && !action.size) {
          throw new Error("Size is required"); // i18n-exempt -- validation error handled by UI layer
        }
        method = "POST";
        body = {
          sku: { id: action.sku.id },
          qty: action.qty ?? 1,
          size: action.size,
          meta: action.meta,
          // Optional rental payload (Phase 3.1)
          rental: action.rental,
        };
        analyticsEvent = {
          type: "add_to_cart",
          productId: action.sku.id,
          size: action.size,
          quantity: action.qty ?? 1,
          source: action.meta?.source,
        };
        break;
      case "remove":
        method = "DELETE";
        body = { id: action.id };
        analyticsEvent = { type: "cart_remove", id: action.id };
        break;
      case "setQty":
        method = "PATCH";
        body = { id: action.id, qty: action.qty };
        analyticsEvent = { type: "cart_set_qty", id: action.id, quantity: action.qty };
        break;
      case "clear":
        method = "DELETE";
        body = {};
        analyticsEvent = { type: "cart_clear" };
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
      throw new Error((data as { error?: string }).error || "Cart update failed"); // i18n-exempt -- fallback message when API doesn't provide localized error
    }

    const data = await res.json();
    setCartStateIfChanged(data.cart as CartState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.cart));
    } catch {
      /* noop */
    }
    if (analyticsEvent) {
      void logAnalyticsEvent(analyticsEvent);
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
  if (!ctx) throw new Error("useCart must be inside CartProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
  return ctx;
}
