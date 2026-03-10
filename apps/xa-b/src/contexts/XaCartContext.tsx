"use client";

import * as React from "react";

import { XA_PRODUCTS, type XaProduct } from "../lib/demoData";
import { readJson, writeJson } from "../lib/storage";
import type { XaCartState } from "../lib/xaCart";
import { cartLineId } from "../lib/xaCart";

type Action =
  | { type: "add"; sku: XaProduct; size?: string; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" };

type Dispatch = (action: Action) => Promise<void>;

const STORAGE_KEY = "XA_CART_V1";

const CartContext = React.createContext<[XaCartState, Dispatch] | undefined>(
  undefined,
);

const currentProductsByIdentity = new Map<string, XaProduct>();
for (const product of XA_PRODUCTS) {
  currentProductsByIdentity.set(`id:${product.id}`, product);
  currentProductsByIdentity.set(`slug:${product.slug}`, product);
}

function resolveCurrentProduct(product: XaProduct): XaProduct {
  return (
    currentProductsByIdentity.get(`id:${product.id}`) ??
    currentProductsByIdentity.get(`slug:${product.slug}`) ??
    product
  );
}

function isLineAvailable(product: XaProduct): boolean {
  return product.status !== "out_of_stock";
}

function sanitizeCart(value: unknown): XaCartState {
  if (!value || typeof value !== "object") return {};
  const out: XaCartState = {};
  for (const [id, line] of Object.entries(value as Record<string, unknown>)) {
    if (!line || typeof line !== "object") continue;
    const sku = (line as { sku?: unknown }).sku;
    const qty = (line as { qty?: unknown }).qty;
    const size = (line as { size?: unknown }).size;
    if (!sku || typeof sku !== "object") continue;
    const qtyNumber = typeof qty === "number" ? qty : Number(qty);
    if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) continue;
    const currentSku = resolveCurrentProduct(sku as XaProduct);
    out[id] = {
      sku: currentSku,
      qty: 1,
      size: typeof size === "string" ? size : undefined,
    };
  }
  return out;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<XaCartState>({});

  React.useEffect(() => {
    const stored = sanitizeCart(readJson<XaCartState>(STORAGE_KEY));
    if (!Object.keys(stored).length) return;
    setCart((current) => {
      if (!Object.keys(current).length) {
        writeJson(STORAGE_KEY, stored);
        return stored;
      }
      const merged = { ...stored, ...current };
      writeJson(STORAGE_KEY, merged);
      return merged;
    });
  }, []);

  const persist = React.useCallback((next: XaCartState) => {
    setCart(next);
    writeJson(STORAGE_KEY, next);
  }, []);

  const dispatch: Dispatch = async (action) => {
    switch (action.type) {
      case "add": {
        if (action.sku.sizes.length && !action.size) {
          throw new Error("Size is required"); // i18n-exempt -- XA-0021: demo validation
        }

        const currentSku = resolveCurrentProduct(action.sku);
        const id = cartLineId(currentSku.id, action.size);
        if (!isLineAvailable(currentSku) || cart[id]) {
          throw new Error("Out of stock"); // i18n-exempt -- XA-0021
        }

        persist({ ...cart, [id]: { sku: currentSku, size: action.size, qty: 1 } });
        return;
      }
      case "remove": {
        const next = { ...cart };
        delete next[action.id];
        persist(next);
        return;
      }
      case "setQty": {
        const line = cart[action.id];
        if (!line) return;
        const requested = Math.floor(action.qty);
        if (!Number.isFinite(requested) || requested <= 0) {
          const next = { ...cart };
          delete next[action.id];
          persist(next);
          return;
        }
        const currentSku = resolveCurrentProduct(line.sku);
        persist({
          ...cart,
          [action.id]: {
            ...line,
            sku: currentSku,
            qty: isLineAvailable(currentSku) ? requested : line.qty,
          },
        });
        return;
      }
      case "clear": {
        persist({});
        return;
      }
      default:
        return;
    }
  };

  return (
    <CartContext.Provider value={[cart, dispatch]}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): [XaCartState, Dispatch] {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider"); // i18n-exempt -- XA-0021
  return ctx;
}
