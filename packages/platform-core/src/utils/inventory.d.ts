import { type InventoryItem } from "../types/inventory";

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
    unit?: unknown;
    variantAttributes?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare function flattenInventoryItem(item: InventoryItem): FlattenedInventoryItem;
export declare function expandInventoryItem(data: RawInventoryItem | InventoryItem): InventoryItem;
export declare function normalizeQuantity(qty: unknown, unit?: unknown): number;
export declare function computeAvailability(quantity: number, reserved?: number, requested?: number, allowBackorder?: boolean): {
    reserved: number;
    available: number;
    canFulfill: boolean;
};
export declare function applyInventoryBatch(items: InventoryItem[], updates: {
    sku: string;
    delta: number;
}[]): {
    updated: InventoryItem[];
    lowStock: InventoryItem[];
};
