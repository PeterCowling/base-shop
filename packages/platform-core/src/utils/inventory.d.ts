import { type InventoryItem } from "@acme/types";
export type FlattenedInventoryItem = {
    sku: string;
    productId: string;
    quantity: number;
    lowStockThreshold?: number;
} & Record<`variant.${string}`, string>;
export interface RawInventoryItem {
    sku: unknown;
    productId?: unknown;
    quantity: unknown;
    lowStockThreshold?: unknown;
    variantAttributes?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare function flattenInventoryItem(item: InventoryItem): FlattenedInventoryItem;
export declare function expandInventoryItem(data: RawInventoryItem | InventoryItem): InventoryItem;
