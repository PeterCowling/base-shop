import "server-only";
import type { InventoryItem } from "@acme/types";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types.js";
export declare const inventoryRepository: InventoryRepository;
export declare function variantKey(sku: string, attrs: Record<string, string>): string;
export declare function readInventoryMap(shop: string): Promise<Record<string, InventoryItem>>;
export declare function readInventory(shop: string): Promise<{
    sku: string;
    productId: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
}[]>;
export declare function writeInventory(shop: string, items: InventoryItem[]): Promise<void>;
export declare function updateInventoryItem(shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn): Promise<{
    sku: string;
    productId: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
} | undefined>;
