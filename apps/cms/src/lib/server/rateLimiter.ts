// apps/cms/src/lib/server/rateLimiter.ts
import type { RateLimiter } from "@acme/auth/rateLimiter";
import { createRateLimiter } from "@acme/auth/rateLimiter";

/**
 * Rate limiters for different CMS operations
 * Configured based on operation criticality and expected usage patterns
 */

// Shop creation/deployment - very restrictive (3 per 5 minutes per IP)
export const shopCreationLimiter: RateLimiter = createRateLimiter({
  points: 3,
  duration: 300, // 5 minutes
});

// Inventory operations - moderate (20 per minute per IP)
export const inventoryLimiter: RateLimiter = createRateLimiter({
  points: 20,
  duration: 60,
});

// Comment creation - moderate (30 per minute per user)
export const commentLimiter: RateLimiter = createRateLimiter({
  points: 30,
  duration: 60,
});

// File uploads (CSV, images) - restrictive (10 per minute per IP)
export const uploadLimiter: RateLimiter = createRateLimiter({
  points: 10,
  duration: 60,
});

// General write operations - moderate (50 per minute per IP)
export const writeOperationLimiter: RateLimiter = createRateLimiter({
  points: 50,
  duration: 60,
});

/**
 * Helper to get client IP from request headers
 * Respects X-Forwarded-For for proxied requests
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take first IP from comma-separated list
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Helper to apply rate limiting in API routes
 * Automatically extracts IP and handles errors
 *
 * @param limiter - The rate limiter to use
 * @param req - The incoming request
 * @param key - Optional key suffix (defaults to IP)
 * @throws Error with message "rate_limit_exceeded" if limit reached
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   try {
 *     await applyRateLimit(shopCreationLimiter, req);
 *     // ... rest of handler
 *   } catch (err) {
 *     if ((err as Error).message === "rate_limit_exceeded") {
 *       return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
 *     }
 *     throw err;
 *   }
 * }
 * ```
 */
export async function applyRateLimit(
  limiter: RateLimiter,
  req: Request,
  key?: string,
): Promise<void> {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const ip = getClientIp(req);
  const rateLimitKey = key ? `${ip}:${key}` : ip;

  await limiter.consume(rateLimitKey);
}
