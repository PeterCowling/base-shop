/**
 * Generated TypeScript types for API responses
 *
 * This file provides type-safe interfaces for all API endpoints
 * that have been migrated to use response validation.
 *
 * Import these types in your client code for end-to-end type safety:
 *
 * @example
 * ```typescript
 * import type { CampaignResponse, LibraryItem } from '@/lib/server/apiTypes';
 *
 * const response = await fetch('/api/campaigns', {
 *   method: 'POST',
 *   body: JSON.stringify({ to, subject, body })
 * });
 * const data: CampaignResponse = await response.json();
 * ```
 */

import { z } from "zod";

// ============================================================================
// Common Response Types
// ============================================================================

export type SuccessResponse = {
  success: true;
};

export type SuccessWithMessageResponse = {
  success: true;
  message?: string;
};

export type OkResponse = {
  ok: true;
};

export type ErrorResponse = {
  error: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ============================================================================
// Campaigns API (/api/campaigns)
// ============================================================================

export type CampaignResponse = OkResponse;
export type CampaignError = ErrorResponse;

// ============================================================================
// Categories API (/api/categories/[shop])
// ============================================================================

export type Category = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  children?: Category[];
  metadata?: Record<string, unknown>;
};

export type CategoriesResponse = SuccessResponse;
export type CategoriesError = ErrorResponse;

// ============================================================================
// Checkout Page API (/api/checkout-page/[shop])
// ============================================================================

export type CheckoutPageSummary = {
  id: string;
  slug: string;
  status: "draft" | "published";
  updatedAt: string;
  templateId?: string;
  previewPath: string;
  draftPreviewPath: string;
};

export type CheckoutPageResponse = CheckoutPageSummary;
export type CheckoutPageError = ErrorResponse;

// ============================================================================
// Library API (/api/library)
// ============================================================================

export type LibraryItem = Record<string, unknown>;

export type LibraryListResponse = LibraryItem[];
export type LibrarySuccessResponse = OkResponse;
export type LibraryError = ErrorResponse;

export type LibraryValidationError = {
  error: string;
  issues?: unknown[];
};

// ============================================================================
// Media API (/api/media)
// ============================================================================

export type MediaItem = Record<string, unknown>;

export type MediaListResponse = MediaItem[];
export type MediaOverviewResponse = Record<string, unknown>;
export type MediaSuccessResponse = {
  success: true;
};
export type MediaError = ErrorResponse;

// ============================================================================
// Pages API (/api/pages/[shop])
// ============================================================================

export type Page = Record<string, unknown>;

export type PagesListResponse = Page[];
export type PageResponse = Page;
export type PagesError = ErrorResponse;

export type PagesValidationError = {
  error: string;
  details: unknown;
};

export type PagesCreateError = {
  errors: unknown;
};

// ============================================================================
// Products API (/api/products)
// ============================================================================

export type ProductSku = {
  slug: string;
  title: string;
  price: number;
  media: unknown[];
  stock: number;
  availability: unknown[];
};

export type ProductListResponse = ProductSku[];
export type ProductResponse = ProductSku;
export type ProductError = ErrorResponse;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as ErrorResponse).error === "string"
  );
}

/**
 * Type guard to check if a response is a success response
 */
export function isSuccessResponse(response: unknown): response is SuccessResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as SuccessResponse).success === true
  );
}

/**
 * Type guard to check if a response is an ok response
 */
export function isOkResponse(response: unknown): response is OkResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "ok" in response &&
    (response as OkResponse).ok === true
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Union type of all possible API responses
 */
export type ApiResponse =
  | CampaignResponse
  | CategoriesResponse
  | CheckoutPageResponse
  | LibraryListResponse
  | LibrarySuccessResponse
  | MediaListResponse
  | MediaOverviewResponse
  | MediaSuccessResponse
  | PagesListResponse
  | PageResponse
  | ProductListResponse
  | ProductResponse;

/**
 * Union type of all possible API errors
 */
export type ApiError =
  | CampaignError
  | CategoriesError
  | CheckoutPageError
  | LibraryError
  | LibraryValidationError
  | MediaError
  | PagesError
  | PagesValidationError
  | PagesCreateError
  | ProductError;

/**
 * Generic API result type that can be either success or error
 */
export type ApiResult<TSuccess, TError = ErrorResponse> =
  | { success: true; data: TSuccess }
  | { success: false; error: TError };

/**
 * Helper to create a typed API client function
 *
 * @example
 * ```typescript
 * const sendCampaign = apiClient<CampaignBody, CampaignResponse>({
 *   url: '/api/campaigns',
 *   method: 'POST',
 * });
 *
 * const result = await sendCampaign({ to, subject, body });
 * if (result.success) {
 *   console.log(result.data); // CampaignResponse
 * } else {
 *   console.error(result.error); // ErrorResponse
 * }
 * ```
 */
export function createApiClient<TBody, TResponse, TError = ErrorResponse>(config: {
  url: string | ((params: Record<string, string>) => string);
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
}) {
  return async (
    body?: TBody,
    params?: Record<string, string>
  ): Promise<ApiResult<TResponse, TError>> => {
    try {
      const url = typeof config.url === "function" ? config.url(params || {}) : config.url;

      const response = await fetch(url, {
        method: config.method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data as TError };
      }

      return { success: true, data: data as TResponse };
    } catch (error) {
      return {
        success: false,
        error: {
          error: error instanceof Error ? error.message : "Network error",
        } as TError,
      };
    }
  };
}
