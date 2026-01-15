"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import { cartReducer, initialCartState } from "@/contexts/cart/cartReducer";
import { loadCart, saveCart } from "@/contexts/cart/cartStorage";
import { getCartTotals } from "@/lib/cart";
import type { CurrencyCode } from "@/types/product";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: CurrencyCode;
  addItem: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, products }: { children: React.ReactNode; products: Product[] }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const totals = useMemo(() => getCartTotals(state, products), [products, state]);

  const addItem = useCallback((variantId: string, quantity: number) => {
    dispatch({ type: "add", payload: { variantId, quantity } });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    dispatch({ type: "remove", payload: { variantId } });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    dispatch({ type: "setQuantity", payload: { variantId, quantity } });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const hydrate = useCallback(() => {
    const stored = loadCart();
    if (stored && stored.length > 0) {
      dispatch({ type: "hydrate", payload: stored });
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    saveCart(state.items);
  }, [state.items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      currency: totals.currency,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [addItem, clear, removeItem, setQuantity, state.items, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // i18n-exempt -- CF-1001 dev-only error message [ttl=2026-12-31]
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
