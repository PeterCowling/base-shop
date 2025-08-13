import type { InventoryItem } from "@acme/types";

export type FlattenedInventoryItem = {
  sku: string;
  productId: string;
  quantity: number;
  lowStockThreshold?: number;
} & Record<`variant.${string}`, string>;

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

export function expandInventoryItem(
  data: Record<string, unknown> | InventoryItem
): InventoryItem {
  const {
    sku,
    productId,
    quantity,
    lowStockThreshold,
    variantAttributes,
    ...rest
  } = data as Record<string, unknown> & { variantAttributes?: Record<string, unknown> };

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

  return {
    sku: String(sku),
    productId: productId ? String(productId) : String(sku),
    variantAttributes: attrs,
    quantity: Number(quantity),
    ...(lowStockThreshold !== undefined && lowStockThreshold !== ""
      ? { lowStockThreshold: Number(lowStockThreshold) }
      : {}),
  };
}
