"use client";
import { asSetCookieHeader, CART_COOKIE, encodeCartCookie, } from "@/lib/cartCookie";
import { createContext, useContext, useEffect, useReducer, } from "react";
/* ---------- reducer ---------- */
function reducer(state, action) {
    switch (action.type) {
        case "add": {
            const line = state[action.sku.id];
            return {
                ...state,
                [action.sku.id]: { sku: action.sku, qty: (line?.qty ?? 0) + 1 },
            };
        }
        case "remove": {
            const { [action.id]: _, ...rest } = state;
            return rest;
        }
        case "setQty":
            return {
                ...state,
                [action.id]: { ...state[action.id], qty: Math.max(1, action.qty) },
            };
        default:
            return state;
    }
}
/* ---------- persistence helpers ---------- */
const LS_KEY = CART_COOKIE;
function readInitial() {
    if (typeof window === "undefined")
        return {};
    try {
        return JSON.parse(decodeURIComponent(localStorage.getItem(LS_KEY) || "{}"));
    }
    catch {
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
    return (<CartContext.Provider value={[state, dispatch]}>
      {children}
    </CartContext.Provider>);
}
export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx)
        throw new Error("useCart must be inside CartProvider");
    return ctx;
}
