import type { XaProduct } from "./demoData";
import type { XaCartState } from "./xaCart";
import { cartReservedQtyForSku } from "./xaCart";
import { readJson, writeJson } from "./storage";

const SOLD_KEY = "XA_INVENTORY_SOLD_V1";

type SoldMap = Record<string, number>;

function sanitizeSoldMap(value: unknown): SoldMap {
  if (!value || typeof value !== "object") return {};
  const out: SoldMap = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[k] = Math.floor(n);
  }
  return out;
}

export function readSoldMap(): SoldMap {
  return sanitizeSoldMap(readJson<SoldMap>(SOLD_KEY));
}

export function getSoldQty(productId: string): number {
  const sold = readSoldMap();
  return sold[productId] ?? 0;
}

export function recordSale(productId: string, qty: number) {
  if (!Number.isFinite(qty) || qty <= 0) return;
  const sold = readSoldMap();
  sold[productId] = (sold[productId] ?? 0) + Math.floor(qty);
  writeJson(SOLD_KEY, sold);
}

export function getAvailableStock(product: XaProduct, cart: XaCartState): number {
  const sold = getSoldQty(product.id);
  const reserved = cartReservedQtyForSku(cart, product.id);
  return Math.max(0, (product.stock ?? 0) - sold - reserved);
}

