/**
 * rateLimiter.ts
 *
 * Simple in-memory rate limiter for the find-booking API.
 * Uses sliding window algorithm with IP-based tracking.
 *
 * Configuration:
 * - 5 requests per IP per 15-minute window
 * - Automatically cleans up old entries
 *
 * Note: This is in-memory and won't work across multiple instances.
 * For production with multiple instances, consider @upstash/ratelimit
 * or similar distributed solution.
 */

/**
 * Rate limit configuration.
 */
export const RATE_LIMIT_CONFIG = {
  /** Maximum requests allowed per window */
  maxRequests: 5,
  /** Window duration in milliseconds (15 minutes) */
  windowMs: 15 * 60 * 1000,
  /** Cleanup interval in milliseconds (5 minutes) */
  cleanupIntervalMs: 5 * 60 * 1000,
} as const;

/**
 * Request record for rate limiting.
 */
interface RequestRecord {
  /** Timestamp of the request */
  timestamp: number;
}

/**
 * IP record tracking all requests from an IP.
 */
interface IpRecord {
  /** Array of request timestamps in the current window */
  requests: RequestRecord[];
}

/**
 * In-memory store for rate limiting data.
 * Keys are IP addresses, values are request records.
 */
const rateLimitStore = new Map<string, IpRecord>();

/**
 * Cleanup interval ID for automatic garbage collection.
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the automatic cleanup interval.
 * Call this on server startup.
 */
export function startRateLimitCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupExpiredEntries();
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs);
}

/**
 * Stop the cleanup interval.
 * Call this on server shutdown.
 */
export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Remove expired entries from the store.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  for (const [ip, record] of rateLimitStore.entries()) {
    // Filter out expired requests
    record.requests = record.requests.filter((r) => r.timestamp >= windowStart);

    // Remove IP entirely if no requests remain
    if (record.requests.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the window */
  remaining: number;
  /** Timestamp when the rate limit resets (oldest request + window) */
  resetAt: number;
  /** Number of requests made in the current window */
  current: number;
}

/**
 * Check if a request from an IP is rate limited.
 * Also records the request if it's allowed.
 *
 * @param ip - The IP address making the request
 * @param recordRequest - Whether to record this as a request (default true)
 * @returns Rate limit check result
 */
export function checkRateLimit(
  ip: string,
  recordRequest = true,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

  // Get or create IP record
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { requests: [] };
    rateLimitStore.set(ip, record);
  }

  // Filter to requests within the current window
  record.requests = record.requests.filter((r) => r.timestamp >= windowStart);

  const current = record.requests.length;
  const allowed = current < RATE_LIMIT_CONFIG.maxRequests;
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxRequests - current - (allowed && recordRequest ? 1 : 0));

  // Calculate reset time (when the oldest request expires)
  const resetAt = record.requests.length > 0
    ? record.requests[0].timestamp + RATE_LIMIT_CONFIG.windowMs
    : now + RATE_LIMIT_CONFIG.windowMs;

  // Record the request if allowed
  if (allowed && recordRequest) {
    record.requests.push({ timestamp: now });
  }

  return {
    allowed,
    remaining,
    resetAt,
    current: current + (allowed && recordRequest ? 1 : 0),
  };
}

/**
 * Get the current rate limit status for an IP without recording a request.
 *
 * @param ip - The IP address to check
 * @returns Current rate limit status
 */
export function getRateLimitStatus(ip: string): RateLimitResult {
  return checkRateLimit(ip, false);
}

/**
 * Clear rate limit data for testing purposes.
 * DO NOT use in production.
 */
export function _clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Get headers to include in rate-limited responses.
 *
 * @param result - Rate limit result
 * @returns Headers object for the response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
