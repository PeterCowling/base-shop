import "server-only";
import { type InventoryItem } from "../types/inventory";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";
export declare function updateInventoryItem(shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn): Promise<InventoryItem | undefined>;
export declare const sqliteInventoryRepository: InventoryRepository;
