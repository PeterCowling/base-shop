import {
  type InventoryItem,
  inventoryItemSchema,
} from "@acme/platform-core/types/inventory";
import { expandInventoryItem } from "@acme/platform-core/utils/inventory";

/**
 * Validate and normalize inventory items.
 * @returns parsed items on success or an error message on failure.
 */
export function validateInventoryItems(items: InventoryItem[]) {
  try {
    const variantKeySet = new Set<string>();
    const requiredKeysBySku = new Map<string, Set<string>>();

    for (const item of items) {
      const errors: string[] = [];
      if (!item.sku.trim()) errors.push("SKU is required");
      if (item.quantity === undefined || Number.isNaN(item.quantity)) {
        errors.push("Quantity is required");
      }
      if (errors.length) {
        return { success: false as const, error: errors.join(", ") };
      }

      const variantEntries = Object.entries(item.variantAttributes ?? {}).filter(
        ([, v]) => v !== "",
      );
      const variantKey = `${item.sku}::${variantEntries
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join("|")}`;
      if (variantKeySet.has(variantKey)) {
        return {
          success: false as const,
          error: `Duplicate inventory row for SKU "${item.sku}" with the same variant attributes.`,
        };
      }
      variantKeySet.add(variantKey);

      if (variantEntries.length) {
        const required = requiredKeysBySku.get(item.sku) ?? new Set<string>();
        variantEntries.forEach(([k]) => required.add(k));
        requiredKeysBySku.set(item.sku, required);
      }
    }

    const cleaned = items.map((i) => ({
      ...i,
      variantAttributes: Object.fromEntries(
        Object.entries(i.variantAttributes ?? {}).filter(([, v]) => v !== ""),
      ),
    }));

    // Guardrail: if any row for a SKU uses variant attributes, all rows for that SKU must include the same keys.
    for (const item of cleaned) {
      const required = requiredKeysBySku.get(item.sku);
      if (required && required.size > 0) {
        const missing = Array.from(required).filter(
          (key) => !item.variantAttributes[key],
        );
        if (missing.length) {
          return {
            success: false as const,
            error: `SKU "${item.sku}" is missing required variant attributes: ${missing.join(
              ", ",
            )}. Add values or remove empty rows to avoid creating a shadow variant.`,
          };
        }
      }
    }

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
