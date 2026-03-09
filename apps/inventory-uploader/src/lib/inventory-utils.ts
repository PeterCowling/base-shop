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
