import {
  inventoryItemSchema,
  type InventoryItem,
} from "@acme/platform-core/types/inventory";
import { expandInventoryItem } from "@acme/platform-core/utils/inventory";

/**
 * Validate and normalize inventory items.
 * @returns parsed items on success or an error message on failure.
 */
export function validateInventoryItems(items: InventoryItem[]) {
  try {
    for (const item of items) {
      const errors: string[] = [];
      if (!item.sku.trim()) errors.push("SKU is required");
      if (item.quantity === undefined || Number.isNaN(item.quantity)) {
        errors.push("Quantity is required");
      }
      if (errors.length) {
        return { success: false as const, error: errors.join(", ") };
      }
    }

    const cleaned = items.map((i) => ({
      ...i,
      variantAttributes: Object.fromEntries(
        Object.entries(i.variantAttributes ?? {}).filter(([, v]) => v !== ""),
      ),
    }));
    const normalized = cleaned.map((i) => expandInventoryItem(i));
    const parsed = inventoryItemSchema.array().safeParse(normalized);
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }
    return { success: true as const, data: parsed.data };
  } catch (err) {
    return { success: false as const, error: (err as Error).message };
  }
}

/**
 * Hook wrapper around {@link validateInventoryItems} for use in components.
 */
export function useInventoryValidation() {
  return validateInventoryItems;
}

