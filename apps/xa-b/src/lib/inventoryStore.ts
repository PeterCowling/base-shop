import type { XaProduct } from "./demoData";
import { readJson, writeJson } from "./storage";
import type { XaCartState } from "./xaCart";

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

export function getAvailableStock(product: XaProduct, _cart: XaCartState): number {
  return product.status === "out_of_stock" ? 0 : 1;
}
