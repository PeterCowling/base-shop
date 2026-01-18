export interface ShopDelegate {
    findUnique: () => Promise<{
        data: Record<string, unknown>;
    }>;
}
export declare function createShopDelegate(): ShopDelegate;
