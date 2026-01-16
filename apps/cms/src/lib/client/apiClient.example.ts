/**
 * Example API client implementations using generated types
 *
 * This file demonstrates how to use the generated TypeScript types
 * for type-safe API calls from client components.
 *
 * Copy and adapt these examples for your own API client implementations.
 */

import {
  createApiClient,
  type CampaignResponse,
  type CategoriesResponse,
  type CheckoutPageResponse,
  type LibraryListResponse,
  type LibrarySuccessResponse,
  type MediaListResponse,
  type MediaItem,
  type PagesListResponse,
  type PageResponse,
  type ProductListResponse,
  type ProductResponse,
  type Category,
} from "@/lib/server/apiTypes";

// ============================================================================
// Campaigns API
// ============================================================================

type CampaignBody = {
  to: string;
  subject: string;
  body: string;
};

export const sendCampaign = createApiClient<CampaignBody, CampaignResponse>({
  url: "/api/campaigns",
  method: "POST",
});

// Usage:
// const result = await sendCampaign({
//   to: 'user@example.com',
//   subject: 'Hello',
//   body: '<p>Welcome!</p>'
// });
// if (result.success) {
//   console.log('Campaign sent successfully');
// }

// ============================================================================
// Categories API
// ============================================================================

export const saveCategories = createApiClient<Category[], CategoriesResponse>({
  url: (params) => `/api/categories/${params.shop}`,
  method: "POST",
});

// Usage:
// const result = await saveCategories(
//   [
//     { id: '1', name: 'Category 1' },
//     { id: '2', name: 'Category 2', parentId: '1' }
//   ],
//   { shop: 'my-shop' }
// );

// ============================================================================
// Checkout Page API
// ============================================================================

type CheckoutPageBody = {
  templateId?: string;
};

export const getCheckoutPage = createApiClient<never, CheckoutPageResponse>({
  url: (params) => `/api/checkout-page/${params.shop}`,
  method: "GET",
});

export const createCheckoutPage = createApiClient<CheckoutPageBody, CheckoutPageResponse>({
  url: (params) => `/api/checkout-page/${params.shop}`,
  method: "POST",
});

// Usage:
// const result = await createCheckoutPage(
//   { templateId: 'default' },
//   { shop: 'my-shop' }
// );
// if (result.success) {
//   console.log('Preview at:', result.data.previewPath);
// }

// ============================================================================
// Library API
// ============================================================================

type LibraryItemBody = {
  item?: Record<string, unknown>;
  items?: Record<string, unknown>[];
};

type LibraryPatchBody = {
  id: string;
  patch: Record<string, unknown>;
};

export const listLibrary = createApiClient<never, LibraryListResponse>({
  url: (params) => `/api/library?shop=${params.shop}`,
  method: "GET",
});

export const saveLibraryItem = createApiClient<LibraryItemBody, LibrarySuccessResponse>({
  url: (params) => `/api/library?shop=${params.shop}`,
  method: "POST",
});

export const updateLibraryItem = createApiClient<LibraryPatchBody, LibrarySuccessResponse>({
  url: (params) => `/api/library?shop=${params.shop}`,
  method: "PATCH",
});

export const deleteLibraryItem = createApiClient<never, LibrarySuccessResponse>({
  url: (params) => `/api/library?shop=${params.shop}&id=${params.id}`,
  method: "DELETE",
});

// Usage:
// const items = await listLibrary(undefined, { shop: 'my-shop' });
// if (items.success) {
//   console.log('Library items:', items.data);
// }

// ============================================================================
// Media API
// ============================================================================

type MediaPatchBody = {
  file: string;
  title?: string | null;
  altText?: string | null;
  tags?: string[] | string | null;
};

export const listMedia = createApiClient<never, MediaListResponse>({
  url: (params) => `/api/media?shop=${params.shop}`,
  method: "GET",
});

export const updateMediaMetadata = createApiClient<MediaPatchBody, MediaItem>({
  url: (params) => `/api/media?shop=${params.shop}`,
  method: "PATCH",
});

export const deleteMedia = createApiClient<never, { success: true }>({
  url: (params) => `/api/media?shop=${params.shop}&file=${params.file}`,
  method: "DELETE",
});

// Note: Media upload requires FormData, use a custom implementation:
// export async function uploadMedia(shop: string, file: File, orientation: 'portrait' | 'landscape') {
//   const formData = new FormData();
//   formData.append('file', file);
//   const response = await fetch(`/api/media?shop=${shop}&orientation=${orientation}`, {
//     method: 'POST',
//     body: formData,
//   });
//   return response.json() as Promise<MediaItem>;
// }

// ============================================================================
// Pages API
// ============================================================================

type PagesQuery = {
  q?: string;
  page?: number;
  limit?: number;
};

type PageCreateBody = {
  title?: string;
  slug?: string;
  locale?: string;
};

export const listPages = (shop: string, query?: PagesQuery) => {
  const params = new URLSearchParams();
  if (query?.q) params.append("q", query.q);
  if (query?.page) params.append("page", String(query.page));
  if (query?.limit) params.append("limit", String(query.limit));

  return fetch(`/api/pages/${shop}?${params.toString()}`)
    .then((res) => res.json() as Promise<PagesListResponse>);
};

export const createPage = createApiClient<PageCreateBody, PageResponse>({
  url: (params) => `/api/pages/${params.shop}`,
  method: "POST",
});

// Usage:
// const pages = await listPages('my-shop', { q: 'home', limit: 10 });
// const result = await createPage(
//   { title: 'New Page', slug: 'new-page' },
//   { shop: 'my-shop' }
// );

// ============================================================================
// Products API
// ============================================================================

type ProductsQuery = {
  q?: string;
  slug?: string;
  shop?: string;
};

export function searchProducts(query: ProductsQuery): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.append("q", query.q);
  if (query.slug) params.append("slug", query.slug);
  if (query.shop) params.append("shop", query.shop);

  return fetch(`/api/products?${params.toString()}`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<ProductListResponse>;
    });
}

export function getProduct(slug: string, shop?: string): Promise<ProductResponse> {
  const params = new URLSearchParams({ slug });
  if (shop) params.append("shop", shop);

  return fetch(`/api/products?${params.toString()}`)
    .then((res) => {
      if (!res.ok) throw new Error("Product not found");
      return res.json() as Promise<ProductResponse>;
    });
}

// Usage:
// const products = await searchProducts({ q: 'shirt', shop: 'bcd' });
// console.log('Found:', products.length, 'products');
//
// const product = await getProduct('blue-shirt-123');
// console.log('Price:', product.price, 'Stock:', product.stock);

// ============================================================================
// Advanced Usage: React Hook Example
// ============================================================================

/**
 * Example React hook for fetching library items with type safety
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { data, loading, error, refetch } = useLibrary('my-shop');
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {data?.map(item => <div key={item.id}>{item.label}</div>)}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
// import { useState, useEffect } from 'react';
//
// export function useLibrary(shop: string) {
//   const [data, setData] = useState<LibraryListResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);
//
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const result = await listLibrary(undefined, { shop });
//       if (result.success) {
//         setData(result.data);
//         setError(null);
//       } else {
//         setError(new Error(result.error.error));
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err : new Error('Unknown error'));
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   useEffect(() => {
//     fetchData();
//   }, [shop]);
//
//   return { data, loading, error, refetch: fetchData };
// }

// ============================================================================
// Type-Safe Wrapper with Better Error Handling
// ============================================================================

/**
 * Enhanced API client with automatic error handling and logging
 */
export async function apiCall<TResponse>(
  apiFunction: () => Promise<TResponse>,
  options?: {
    onError?: (error: string) => void;
    errorMessage?: string;
  }
): Promise<TResponse | null> {
  try {
    return await apiFunction();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(options?.errorMessage || "API call failed:", message);
    options?.onError?.(message);
    return null;
  }
}

// Usage:
// const products = await apiCall(
//   () => searchProducts({ q: 'shirt' }),
//   {
//     errorMessage: 'Failed to search products',
//     onError: (msg) => toast.error(msg)
//   }
// );
// if (products) {
//   // Handle successful response
// }
