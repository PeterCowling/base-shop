import "server-only";
/** Check if `data/shops/<shop>` exists and is a directory. */
export declare function checkShopExists(shop: string): Promise<boolean>;
