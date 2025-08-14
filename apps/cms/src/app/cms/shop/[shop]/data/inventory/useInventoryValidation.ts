import { inventoryItemSchema, type InventoryItem } from "@acme/types";
import { expandInventoryItem } from "@platform-core/utils/inventory";

/**
 * Validate and normalize inventory items.
 * @returns parsed items on success or an error message on failure.
 */
export function validateInventoryItems(items: InventoryItem[]) {
  const normalized = items.map((i) => expandInventoryItem(i));
  const parsed = inventoryItemSchema.array().safeParse(normalized);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }
  return { success: true as const, data: parsed.data };
}

/**
 * Hook wrapper around {@link validateInventoryItems} for use in components.
 */
export function useInventoryValidation() {
  return validateInventoryItems;
}

