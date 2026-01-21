import type { InventoryItem } from "../types/inventory";

export type InventoryMutateFn = (current: InventoryItem | undefined) => InventoryItem | undefined;
export interface InventoryRepository {
    read(shop: string): Promise<InventoryItem[]>;
    write(shop: string, items: InventoryItem[]): Promise<void>;
    update(shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn): Promise<InventoryItem | undefined>;
}
