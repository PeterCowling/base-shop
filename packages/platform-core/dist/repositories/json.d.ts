import type { ShopSettings } from "@types";
import { ProductPublication } from "../products";
export declare function readSettings(shop: string): Promise<ShopSettings>;
export declare function writeSettings(shop: string, settings: ShopSettings): Promise<void>;
/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
export declare function readRepo(shop: string): Promise<ProductPublication[]>;
/**
 * Write full catalogue atomically
 */
export declare function writeRepo(shop: string, catalogue: ProductPublication[]): Promise<void>;
export declare function getProductById(shop: string, id: string): Promise<ProductPublication | null>;
export declare function updateProductInRepo(shop: string, patch: Partial<ProductPublication> & {
    id: string;
}): Promise<ProductPublication>;
export declare function deleteProductFromRepo(shop: string, id: string): Promise<void>;
export declare function duplicateProductInRepo(shop: string, id: string): Promise<ProductPublication>;
