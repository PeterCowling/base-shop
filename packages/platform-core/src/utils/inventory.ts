import { inventoryItemSchema, type InventoryItem } from "@acme/types";

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
  variantAttributes?: Record<string, unknown>;
  [key: string]: unknown;
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
  return (
    typeof (data as any).sku === "string" &&
    typeof (data as any).productId === "string" &&
    typeof (data as any).quantity === "number" &&
    typeof (data as any).variantAttributes === "object"
  );
}

export function expandInventoryItem(
  data: RawInventoryItem | InventoryItem
): InventoryItem {
  if (isInventoryItem(data)) {
    return inventoryItemSchema.parse(data);
  }
  const {
    sku,
    productId,
    quantity,
    lowStockThreshold,
    variantAttributes,
    ...rest
  } = data;

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
    productId: productId ? String(productId) : String(sku),
    variantAttributes: attrs,
    quantity: Number(quantity),
    ...(lowStockThreshold !== undefined && lowStockThreshold !== ""
      ? { lowStockThreshold: Number(lowStockThreshold) }
      : {}),
  };

  return inventoryItemSchema.parse(item);
}
