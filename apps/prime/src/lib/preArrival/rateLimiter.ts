/**
 * rateLimiter.ts
 *
 * Simple in-memory rate limiter for the find-booking API.
 * Uses token bucket algorithm with IP-based tracking.
 *
 * Configuration:
 * - 5 requests per IP per 15-minute window
 * - Automatically cleans up old entries
 *
 * Note: This is in-memory and won't work across multiple instances.
 * For production with multiple instances, consider @upstash/ratelimit
 * or similar distributed solution.
 */

import { TokenBucket } from "@acme/lib";

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
 * Bucket refill rate derived from max requests / window.
 */
const REFILL_RATE_PER_SECOND =
  RATE_LIMIT_CONFIG.maxRequests / (RATE_LIMIT_CONFIG.windowMs / 1000);

/**
 * IP record tracking bucket state for an IP.
 */
interface IpRecord {
  /** Token bucket for this IP */
  bucket: TokenBucket;
  /** Last time this IP interacted with the limiter */
  lastSeenAt: number;
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

  for (const [ip, record] of rateLimitStore.entries()) {
    const { tokens } = record.bucket.peek();
    const isFull = tokens >= RATE_LIMIT_CONFIG.maxRequests;
    const isIdleBeyondWindow =
      now - record.lastSeenAt >= RATE_LIMIT_CONFIG.windowMs;
    if (isFull && isIdleBeyondWindow) {
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
  /** Timestamp when bucket replenishment clears the current limit state */
  resetAt: number;
  /** Number of requests made in the current window */
  current: number;
}

function createIpRecord(now: number): IpRecord {
  return {
    bucket: new TokenBucket({
      capacity: RATE_LIMIT_CONFIG.maxRequests,
      refillRate: REFILL_RATE_PER_SECOND,
    }),
    lastSeenAt: now,
  };
}

function msUntilTokens(tokensNeeded: number): number {
  return Math.ceil((tokensNeeded / REFILL_RATE_PER_SECOND) * 1000);
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

  // Get or create IP record
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = createIpRecord(now);
    rateLimitStore.set(ip, record);
  }
  record.lastSeenAt = now;

  if (recordRequest) {
    const consumed = record.bucket.consume(1);
    const remaining = Math.max(0, Math.floor(consumed.remainingTokens));
    const current = RATE_LIMIT_CONFIG.maxRequests - remaining;
    const resetAt = consumed.allowed
      ? now + msUntilTokens(RATE_LIMIT_CONFIG.maxRequests - consumed.remainingTokens)
      : now + (consumed.retryAfterMs ?? RATE_LIMIT_CONFIG.windowMs);

    return {
      allowed: consumed.allowed,
      remaining,
      resetAt,
      current,
    };
  }

  const status = record.bucket.peek();
  const remaining = Math.max(0, Math.floor(status.tokens));
  const current = RATE_LIMIT_CONFIG.maxRequests - remaining;
  const tokensUntilNext = Math.max(0, 1 - status.tokens);
  const retryAfterMs = tokensUntilNext > 0 ? msUntilTokens(tokensUntilNext) : null;
  const resetAt = now + (retryAfterMs ?? msUntilTokens(RATE_LIMIT_CONFIG.maxRequests - status.tokens));

  return {
    allowed: status.tokens >= 1,
    remaining,
    resetAt,
    current,
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
