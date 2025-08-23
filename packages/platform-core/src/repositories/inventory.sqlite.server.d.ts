import "server-only";
import { type InventoryItem } from "@acme/types";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types.js";
export declare function updateInventoryItem(shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn): Promise<InventoryItem | undefined>;
export declare const sqliteInventoryRepository: InventoryRepository;
