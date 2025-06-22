import { ProductPublication } from "../products";
/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
export declare function readRepo(shop: string): Promise<ProductPublication[]>;
/**
 * Write full catalogue atomically
 */
export declare function writeRepo(shop: string, catalogue: ProductPublication[]): Promise<void>;
