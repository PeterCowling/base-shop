"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import {
  asSetCookieHeader,
  CART_COOKIE,
  encodeCartCookie,
} from "../cartCookie";

/* ---------- reducer ---------- */
function reducer(state, action) {
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
/* ---------- persistence helpers ---------- */
const LS_KEY = CART_COOKIE;
function readInitial() {
  if (typeof window === "undefined") return {};
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return cartStateSchema.parse(parsed);
  } catch (err) {
    console.warn("Invalid cart state in localStorage", err);
    return {};
    return {};
  }
}
function persist(state) {
  if (typeof window !== "undefined") {
    const encoded = encodeCartCookie(state);
    /* localStorage for client rehydration */
    localStorage.setItem(LS_KEY, encoded);
    /* cookie for server-side pages (e.g. /checkout) */
    document.cookie = asSetCookieHeader(encoded);
  }
}
/* ---------- context ---------- */
const CartContext = createContext(undefined);
export function CartProvider({ children }) {
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
