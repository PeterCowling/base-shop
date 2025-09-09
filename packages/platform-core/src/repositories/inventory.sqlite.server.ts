import "server-only";
import type { InventoryItem } from "../types/inventory";
import type { InventoryRepository } from "./inventory.types";
import { jsonInventoryRepository } from "./inventory.json.server";

// Placeholder SQLite implementation delegating to the JSON repository while
// normalizing the shape of returned items to match the legacy SQLite schema.
export const sqliteInventoryRepository: InventoryRepository = {
  async read(shop: string): Promise<InventoryItem[]> {
    const items = await jsonInventoryRepository.read(shop);
    // Legacy SQLite consumers expect only sku, quantity and variantAttributes.
    return items.map(({ sku, quantity, variantAttributes }) => ({
      sku,
      quantity,
      variantAttributes,
    })) as unknown as InventoryItem[];
  },
  write: jsonInventoryRepository.write,
  update: jsonInventoryRepository.update,
};
