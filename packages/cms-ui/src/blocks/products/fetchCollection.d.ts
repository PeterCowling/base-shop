import type { SKU } from "@acme/types";
/**
 * Fetch products for a given collection and map them to SKUs.
 * This utility expects an API response containing a `products` array.
 * If the request fails, an empty array is returned.
 */
export declare function fetchCollection(collectionId: string): Promise<SKU[]>;
//# sourceMappingURL=fetchCollection.d.ts.map