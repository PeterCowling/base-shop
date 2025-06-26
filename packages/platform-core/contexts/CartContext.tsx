/* packages/platform-core/contexts/CartContext.tsx */
"use client";

import type { CartState, SKU } from "@types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  asSetCookieHeader,
  CART_COOKIE,
  encodeCartCookie,
} from "../cartCookie";

/* ---------- types ---------- */

type Action =
  | { type: "add"; sku: SKU }
  | { type: "remove"; id: SKU["id"] }
  | { type: "setQty"; id: SKU["id"]; qty: number };

/* ---------- reducer ---------- */

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const line = state[action.sku.id];
      return {
        ...state,
        [action.sku.id]: { sku: action.sku, qty: (line?.qty ?? 0) + 1 },
      };
    }

    case "remove": {
      /** remove without creating an unused binding */
      const next = { ...state };
      delete next[action.id];
      return next;
    }

    case "setQty": {
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          qty: Math.max(1, action.qty),
        },
      };
    }

    default:
      return state;
  }
}

/* ---------- persistence helpers ---------- */

const LS_KEY = CART_COOKIE;

function readInitial(): CartState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      decodeURIComponent(localStorage.getItem(LS_KEY) || "{}")
    ) as CartState;
  } catch {
    return {};
  }
}

function persist(state: CartState) {
  if (typeof window !== "undefined") {
    const encoded = encodeCartCookie(state);

    // localStorage for client re-hydration
    localStorage.setItem(LS_KEY, encoded);

    // cookie for SSR routes (e.g. /checkout)
    document.cookie = asSetCookieHeader(encoded);
  }
}

/* ---------- context ---------- */

const CartContext = createContext<
  [CartState, React.Dispatch<Action>] | undefined
>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {}, readInitial);

  useEffect(() => persist(state), [state]);

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
