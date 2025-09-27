import type { SKU } from "@acme/types";

/**
 * Fetch products for a given collection and map them to SKUs.
 * This utility expects an API response containing a `products` array.
 * If the request fails, an empty array is returned.
 */
export async function fetchCollection(collectionId: string): Promise<SKU[]> {
  try {
    // Extend RequestInit for Next.js-specific `next` options without using `any`.
    type NextFetchInit = RequestInit & { next?: { revalidate?: number; tags?: string[] } };
    const res = await fetch(`/api/collections/${collectionId}`, {
      next: { revalidate: 60, tags: ["collections", `collection:${collectionId}`] },
    } as NextFetchInit);
    if (!res.ok) {
      // i18n-exempt: developer log; not user-facing
      console.error(`Failed to fetch collection ${collectionId}:`, res.statusText);
      return [];
    }
    const data = await res.json();
    const products = Array.isArray(data)
      ? data
      : (data.items ?? data.products ?? []);
    return (products ?? []) as SKU[];
  } catch (err) {
    // i18n-exempt: developer log; not user-facing
    console.error("fetchCollection error", err);
    return [];
  }
}
