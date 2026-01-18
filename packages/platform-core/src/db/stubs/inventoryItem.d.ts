export interface InventoryItemRecord {
    shopId: string;
    sku: string;
    variantKey: string;
    [key: string]: unknown;
}
type ShopSkuVariantKey = {
    shopId: string;
    sku: string;
    variantKey: string;
};
export type InventoryItemDelegate = {
    findMany(args: {
        where: {
            shopId: string;
        };
    }): Promise<InventoryItemRecord[]>;
    deleteMany(args: {
        where: {
            shopId: string;
        };
    }): Promise<{
        count: number;
    }>;
    createMany(args: {
        data: InventoryItemRecord[];
    }): Promise<{
        count: number;
    }>;
    findUnique(args: {
        where: {
            shopId_sku_variantKey: ShopSkuVariantKey;
        };
    }): Promise<InventoryItemRecord | null>;
    delete(args: {
        where: {
            shopId_sku_variantKey: ShopSkuVariantKey;
        };
    }): Promise<InventoryItemRecord>;
    upsert(args: {
        where: {
            shopId_sku_variantKey: ShopSkuVariantKey;
        };
        update: Partial<InventoryItemRecord>;
        create: Partial<InventoryItemRecord>;
    }): Promise<InventoryItemRecord>;
};
export declare function createInventoryItemDelegate(): InventoryItemDelegate;
export {};
