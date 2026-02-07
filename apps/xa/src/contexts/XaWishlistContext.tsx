"use client";

import * as React from "react";

import type { XaProduct } from "../lib/demoData";
import { readJson, writeJson } from "../lib/storage";

type XaWishlistState = string[];

type Action =
  | { type: "add"; sku: XaProduct }
  | { type: "remove"; skuId: string }
  | { type: "toggle"; sku: XaProduct }
  | { type: "clear" };

type Dispatch = (action: Action) => void;

const STORAGE_KEY = "XA_WISHLIST_V1";

const WishlistContext = React.createContext<[XaWishlistState, Dispatch] | undefined>(
  undefined,
);

function sanitizeWishlist(value: unknown): XaWishlistState {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((item): item is string => typeof item === "string");
  return Array.from(new Set(ids));
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = React.useState<XaWishlistState>([]);

  React.useEffect(() => {
    const stored = sanitizeWishlist(readJson<XaWishlistState>(STORAGE_KEY));
    if (!stored.length) return;
    setWishlist((current) => {
      if (!current.length) {
        writeJson(STORAGE_KEY, stored);
        return stored;
      }
      const merged = Array.from(new Set([...stored, ...current]));
      writeJson(STORAGE_KEY, merged);
      return merged;
    });
  }, []);

  const persist = React.useCallback((next: XaWishlistState) => {
    setWishlist(next);
    writeJson(STORAGE_KEY, next);
  }, []);

  const dispatch: Dispatch = (action) => {
    switch (action.type) {
      case "add": {
        const id = action.sku.id;
        if (!id || wishlist.includes(id)) return;
        persist([id, ...wishlist]);
        return;
      }
      case "remove": {
        persist(wishlist.filter((id) => id !== action.skuId));
        return;
      }
      case "toggle": {
        const id = action.sku.id;
        if (!id) return;
        if (wishlist.includes(id)) {
          persist(wishlist.filter((item) => item !== id));
        } else {
          persist([id, ...wishlist]);
        }
        return;
      }
      case "clear": {
        persist([]);
        return;
      }
      default:
        return;
    }
  };

  return (
    <WishlistContext.Provider value={[wishlist, dispatch]}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): [XaWishlistState, Dispatch] {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be inside WishlistProvider"); // i18n-exempt -- XA-0021
  return ctx;
}
