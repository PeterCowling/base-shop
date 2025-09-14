import "server-only";
import type { InventoryItem } from "../types/inventory";
export declare function checkAndAlert(shop: string, items: InventoryItem[]): Promise<number>;
