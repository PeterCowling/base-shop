import { clampQuantity, MIN_QTY } from "@/lib/quantity";
import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "cochlearfit:cart";
const STORAGE_VERSION = 1;

type StoredCart = {
  version: number;
  items: CartItem[];
};

const isCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as CartItem;
  return (
    typeof item.variantId === "string" &&
    typeof item.quantity === "number" &&
    item.quantity >= MIN_QTY
  );
};

export function loadCart(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCart;
    if (!parsed || parsed.version !== STORAGE_VERSION) return null;
    if (!Array.isArray(parsed.items)) return null;
    return parsed.items
      .filter(isCartItem)
      .map((item) => ({
        variantId: item.variantId,
        quantity: clampQuantity(item.quantity),
      }));
  } catch {
    return null;
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  const payload: StoredCart = {
    version: STORAGE_VERSION,
    items: items.map((item) => ({
      variantId: item.variantId,
      quantity: clampQuantity(item.quantity),
    })),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
