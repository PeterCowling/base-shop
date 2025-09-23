import type { SKU } from "@acme/types";

/**
 * Fetch products for a given collection and map them to SKUs.
 * This utility expects an API response containing a `products` array.
 * If the request fails, an empty array is returned.
 */
export async function fetchCollection(collectionId: string): Promise<SKU[]> {
  try {
    const res = await fetch(`/api/collections/${collectionId}`, { next: { revalidate: 60, tags: ["collections", `collection:${collectionId}`] } as any });
    if (!res.ok) {
      console.error(`Failed to fetch collection ${collectionId}:`, res.statusText);
      return [];
    }
    const data = await res.json();
    const products = Array.isArray(data)
      ? data
      : (data.items ?? data.products ?? []);
    return (products ?? []) as SKU[];
  } catch (err) {
    console.error("fetchCollection error", err);
    return [];
  }
}
