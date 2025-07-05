// packages/platform-core/contexts/CartContext.tsx
"use client";

import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "../cartCookie";

import type { CartState, SKU } from "@types";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

/* ------------------------------------------------------------------
 * Action types
 * ------------------------------------------------------------------ */
type Action =
  | { type: "add"; sku: SKU; size?: string }
  | { type: "remove"; id: SKU["id"] }
  | { type: "setQty"; id: SKU["id"]; qty: number };

/* ------------------------------------------------------------------
 * Reducer
 * ------------------------------------------------------------------ */
function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const line = state[action.sku.id];
      return {
        ...state,
        [action.sku.id]: {
          sku: action.sku,
          qty: (line?.qty ?? 0) + 1,
          size: action.size ?? line?.size,
        },
      };
    }

    case "remove": {
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

/* ------------------------------------------------------------------
 * Persistence helpers
 * ------------------------------------------------------------------ */
const LS_KEY = CART_COOKIE;

/** Initialiser passed to `useReducer` so state is hydrated exactly once. */
function readInitial(): CartState {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LS_KEY);
  return decodeCartCookie(raw); // already returns CartState
}

/** Persist cart state to both localStorage (for CSR) and cookie (for SSR). */
function persist(state: CartState) {
  if (typeof window === "undefined") return;
  const encoded = encodeCartCookie(state);

  /* client re-hydration */
  localStorage.setItem(LS_KEY, encoded);

  /* SSR routes that rely on the cookie */
  document.cookie = asSetCookieHeader(encoded);
}

/* ------------------------------------------------------------------
 * React context
 * ------------------------------------------------------------------ */
const CartContext = createContext<
  [CartState, React.Dispatch<Action>] | undefined
>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {}, readInitial);

  /* persist any time the cart changes */
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
