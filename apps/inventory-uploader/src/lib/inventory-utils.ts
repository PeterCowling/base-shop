export const SHOP_STORAGE_KEY = "inventory-uploader:shop";

export type InventoryItem = {
  sku: string;
  productId: string;
  quantity: number;
  variantAttributes: Record<string, string>;
  lowStockThreshold?: number;
};

export type AuditEntry = {
  id: string;
  sku: string;
  variantKey: string;
  quantityDelta: number;
  note: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type LedgerEvent = {
  id: string;
  timestamp: string;
  type: "adjustment" | "inflow" | "sale";
  sku: string;
  variantKey: string;
  quantityDelta: number;
  referenceId: string | null;
  note: string | null;
};

export function createKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function itemKey(item: Pick<InventoryItem, "sku" | "variantAttributes">): string {
  return `${item.sku}##${Object.entries(item.variantAttributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(",")}`;
}

export function itemLabel(item: Pick<InventoryItem, "sku" | "variantAttributes">): string {
  const attrs = Object.entries(item.variantAttributes);
  return attrs.length > 0
    ? `${item.sku} (${attrs.map(([k, v]) => `${k}:${v}`).join(", ")})`
    : item.sku;
}

/** Formats variant attributes as "key: value, …". Returns `emptyLabel` when there are no attributes. */
export function variantLabel(attrs: Record<string, string>, emptyLabel = ""): string {
  const entries = Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return emptyLabel;
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

export const HISTORY_DISPLAY_LIMIT = 10;

/** Formats a quantity delta with a leading + sign for positive values. */
export function formatQuantityDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

/** Builds a client-side API URL for inventory endpoints. All path segments are URI-encoded. */
export function inventoryApiUrl(shop: string, ...pathSegments: string[]): string {
  const base = `/api/inventory/${encodeURIComponent(shop)}`;
  if (pathSegments.length === 0) return base;
  return `${base}/${pathSegments.map(encodeURIComponent).join("/")}`;
}

/**
 * Parses a string input as a strict integer for stock operations.
 * `"nonzero"` — accepts any non-zero integer (adjustments).
 * `"positive"` — accepts only positive integers (inflows).
 */
export function parseIntQuantity(
  value: string,
  mode: "nonzero" | "positive",
): { ok: true; qty: number } | { ok: false; error: string } {
  const qty = Number(value);
  if (mode === "positive") {
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
      return { ok: false, error: "Quantity must be a positive integer." };
    }
  } else {
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty === 0) {
      return { ok: false, error: "Quantity delta must be a non-zero integer." };
    }
  }
  return { ok: true, qty };
}

/** Safely extracts a typed array from a JSON response field. Returns [] when the field is missing or not an array. */
export function extractArray<T>(data: unknown, key: string): T[] {
  if (data && typeof data === "object" && key in data && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

/** Returns true when `err` is a fetch AbortError (request was cancelled intentionally). */
export function isFetchAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

export function formatAuditDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
