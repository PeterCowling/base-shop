/**
 * Fetch products for a given collection and map them to SKUs.
 * This utility expects an API response containing a `products` array.
 * If the request fails, an empty array is returned.
 */
export async function fetchCollection(collectionId) {
    try {
        const res = await fetch(`/api/collections/${collectionId}`);
        if (!res.ok) {
            console.error(`Failed to fetch collection ${collectionId}:`, res.statusText);
            return [];
        }
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.products;
        return (products ?? []);
    }
    catch (err) {
        console.error("fetchCollection error", err);
        return [];
    }
}
