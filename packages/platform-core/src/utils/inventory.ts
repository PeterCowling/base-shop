import {
  type InventoryItem,
  inventoryItemSchema,
} from "../types/inventory";

export type FlattenedInventoryItem = {
  sku: string;
  productId: string;
  quantity: number;
  lowStockThreshold?: number;
} & Record<`variant.${string}`, string>;

export interface RawInventoryItem {
  sku: unknown;
  productId?: unknown;
  quantity: unknown;
  lowStockThreshold?: unknown;
  unit?: unknown;
  variantAttributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export function normalizeQuantity(
  qty: unknown,
  unit: unknown = "unit",
): number {
  const num = typeof qty === "string" ? Number(qty) : (qty as number);
  if (!Number.isFinite(num)) return NaN;
  const factor = unit === "dozen" ? 12 : unit === "pair" ? 2 : 1;
  return Math.round(num * factor);
}
export function flattenInventoryItem(item: InventoryItem): FlattenedInventoryItem {
  const variants = Object.fromEntries(
    Object.entries(item.variantAttributes).map(([k, v]) => [`variant.${k}`, v])
  );
  return {
    sku: item.sku,
    productId: item.productId,
    ...variants,
    quantity: item.quantity,
    ...(item.lowStockThreshold !== undefined
      ? { lowStockThreshold: item.lowStockThreshold }
      : {}),
  };
}

function isInventoryItem(data: RawInventoryItem | InventoryItem): data is InventoryItem {
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.sku === "string" &&
    typeof obj.productId === "string" &&
    typeof obj.quantity === "number" &&
    typeof obj.variantAttributes === "object"
  );
}

export function expandInventoryItem(
  data: RawInventoryItem | InventoryItem
): InventoryItem {
  if (isInventoryItem(data)) {
    if (data.quantity < 0) {
      throw new Error("quantity must be greater than or equal to 0"); // i18n-exempt -- CORE-1014 validation message
    }
    if (data.productId.trim() === "") {
      throw new Error("productId is required"); // i18n-exempt -- CORE-1014 validation message
    }
    return inventoryItemSchema.parse(data);
  }
  const {
    sku,
    productId,
    quantity,
    lowStockThreshold,
    unit,
    variantAttributes,
    ...rest
  } = data;

  if (typeof sku !== "string" || sku.trim() === "") {
    throw new Error("sku is required"); // i18n-exempt -- CORE-1014 validation message
  }
  if (
    productId === undefined ||
    productId === null ||
    String(productId).trim() === ""
  ) {
    throw new Error("productId is required"); // i18n-exempt -- CORE-1014 validation message
  }

  const normalizedQuantity = normalizeQuantity(quantity, unit);
  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 0) {
    throw new Error("quantity must be greater than or equal to 0"); // i18n-exempt -- CORE-1014 validation message
  }

  const normalizedLowStock =
    lowStockThreshold !== undefined && lowStockThreshold !== ""
      ? normalizeQuantity(lowStockThreshold, unit)
      : undefined;

  const attrs =
    typeof variantAttributes === "object" && variantAttributes !== null
      ? Object.fromEntries(
          Object.entries(variantAttributes).filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        )
      : Object.fromEntries(
          Object.entries(rest)
            .filter(([k, v]) => k.startsWith("variant.") && v !== undefined && v !== "")
            .map(([k, v]) => [k.slice("variant.".length), String(v)])
        );

  const item = {
    sku: String(sku),
    productId: String(productId),
    variantAttributes: attrs,
    quantity: normalizedQuantity,
    ...(normalizedLowStock !== undefined
      ? { lowStockThreshold: normalizedLowStock }
      : {}),
  };

  return inventoryItemSchema.parse(item);
}

export function computeAvailability(
  quantity: number,
  reserved = 0,
  requested = 0,
  allowBackorder = false,
) {
  const available = Math.max(0, quantity - reserved);
  const canFulfill = available >= requested || allowBackorder;
  return { reserved, available, canFulfill };
}

export function applyInventoryBatch(
  items: InventoryItem[],
  updates: { sku: string; delta: number }[],
) {
  const map = new Map<string, InventoryItem>();
  for (const item of items) {
    map.set(item.sku, { ...item });
  }
  for (const u of updates) {
    const current = map.get(u.sku);
    if (current) {
      current.quantity = Math.max(0, current.quantity + u.delta);
    }
  }
  const updated = Array.from(map.values());
  const lowStock = updated.filter(
    (i) =>
      typeof i.lowStockThreshold === "number" &&
      i.quantity <= i.lowStockThreshold!,
  );
  return { updated, lowStock };
}
