import type { NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Get or create a request ID from headers
 * Used for request tracing and correlation
 */
export function getOrCreateRequestId(headers: Headers): string {
  const existing = headers.get(REQUEST_ID_HEADER);
  if (existing) return existing;
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get shop ID from request headers
 * Falls back to null if not present (caller should provide fallback)
 */
export function getShopIdFromHeaders(headers: Headers): string | null {
  return headers.get("x-shop-id");
}

/**
 * Get shop ID from request
 *
 * SECURITY: This is the canonical source of truth for shop identification.
 * Shop ID is used to:
 * - Scope cart storage keys (prevent cross-shop leakage)
 * - Validate cart cookie signatures
 * - Resolve shop-specific products/inventory
 *
 * @param req - Next.js request object
 * @returns Shop ID string
 * @throws Error if shop ID cannot be determined
 */
export function getShopIdFromRequest(_req: NextRequest): string {
  // Strategy 1: Environment variable (one shop per deployment)
  const envShopId = process.env.SHOP_ID;
  if (envShopId) {
    return envShopId;
  }

  // Strategy 2: Hostname-based mapping (for multi-tenant deployments)
  // Uncomment and configure when multi-tenancy is needed:
  /*
  const hostname = req.headers.get('host');
  if (hostname) {
    const shopId = HOSTNAME_TO_SHOP_MAP[hostname];
    if (shopId) {
      return shopId;
    }
  }
  */

  // Strategy 3: Database lookup (for fully dynamic shops)
  // Uncomment when dynamic shop resolution is needed:
  /*
  const hostname = req.headers.get('host');
  if (hostname) {
    const shop = await getShopByHostname(hostname);
    if (shop) {
      return shop.id;
    }
  }
  */

  throw new Error(
    'SHOP_ID environment variable not set. ' +
    'Set SHOP_ID or implement hostname-based shop resolution.'
  );
}

/**
 * Validate shop ID format
 *
 * Ensures shop IDs follow expected format to prevent injection attacks
 */
export function isValidShopId(shopId: unknown): shopId is string {
  if (typeof shopId !== 'string') return false;
  if (shopId.length === 0) return false;
  if (shopId.length > 100) return false; // Reasonable limit

  // Shop IDs should be alphanumeric with hyphens/underscores only
  return /^[a-zA-Z0-9_-]+$/.test(shopId);
}

/**
 * Get and validate shop ID from request
 *
 * Throws if shop ID is missing or invalid
 */
export function getValidatedShopId(req: NextRequest): string {
  const shopId = getShopIdFromRequest(req);

  if (!isValidShopId(shopId)) {
    throw new Error(`Invalid shop ID format: ${shopId}`);
  }

  return shopId;
}

/**
 * Validate shop ID - throws if invalid, returns the shopId if valid
 * Alias for compatibility
 */
export function validateShopId(shopId: string): string {
  if (!isValidShopId(shopId)) {
    throw new Error(`Invalid shop ID format: ${shopId}`);
  }
  return shopId;
}

/**
 * Resolve shop ID from Stripe event metadata
 */
export function resolveShopIdFromStripeEvent(
  event: { data?: { object?: unknown } }
): string | null {
  const obj = event?.data?.object;
  if (!obj || typeof obj !== "object") return null;

  const metadata = (obj as { metadata?: unknown }).metadata;
  if (!metadata || typeof metadata !== "object") return null;

  const shopId = (metadata as Record<string, unknown>)["shop_id"] ??
                 (metadata as Record<string, unknown>)["shopId"];
  if (typeof shopId === "string" && isValidShopId(shopId)) {
    return shopId;
  }
  return null;
}
