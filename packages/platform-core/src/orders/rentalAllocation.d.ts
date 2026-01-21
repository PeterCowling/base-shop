import type { SKU } from "@acme/types";

import type { InventoryItem } from "../types/inventory";
/**
 * Reserve a rental inventory item if available and within wear limits.
 *
 * @param items - inventory items for the SKU
 * @param sku - product information containing availability and wear limits
 * @param from - desired rental start ISO date
 * @param to - desired rental end ISO date
 * @returns the reserved item or null if none available
 */
export declare function reserveRentalInventory(shop: string, items: InventoryItem[], sku: SKU, from: string, to: string): Promise<(InventoryItem & {
    wearCount: number;
}) | null>;
