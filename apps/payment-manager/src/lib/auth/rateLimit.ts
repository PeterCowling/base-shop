import type { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  limit: number;
};

declare global {
  var __pmRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

/** Maximum number of rate-limit entries to keep in memory. LRU-evict when exceeded. */
const MAX_ENTRIES = 20_000;

function getStore() {
  if (!globalThis.__pmRateLimitStore) {
    globalThis.__pmRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalThis.__pmRateLimitStore;
}

function pruneStore(now: number) {
  const store = getStore();

  // Remove expired entries first.
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }

  // LRU eviction if still over limit.
  if (store.size <= MAX_ENTRIES) return;

  const overflow = store.size - MAX_ENTRIES;
  const candidates = [...store.entries()]
    .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt)
    .slice(0, overflow);
  for (const [key] of candidates) {
    store.delete(key);
  }
}

export function getRequestIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function rateLimit({
  key,
  windowMs,
  max,
}: {
  key: string;
  windowMs: number;
  max: number;
}): RateLimitResult {
  const now = Date.now();
  pruneStore(now);

  const store = getStore();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt, lastSeenAt: now });
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt,
      retryAfter: 0,
      limit: max,
    };
  }

  const nextCount = existing.count + 1;
  store.set(key, { count: nextCount, resetAt: existing.resetAt, lastSeenAt: now });

  const allowed = nextCount <= max;
  const remaining = Math.max(0, max - nextCount);
  const retryAfter = allowed ? 0 : Math.max(0, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed,
    remaining,
    resetAt: existing.resetAt,
    retryAfter,
    limit: max,
  };
}

export function withRateHeaders(response: NextResponse, limit: RateLimitResult): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(limit.limit));
  response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(limit.resetAt / 1000)));
  if (!limit.allowed) {
    response.headers.set("Retry-After", String(limit.retryAfter));
  }
  return response;
}

export function __clearRateLimitStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  getStore().clear();
}

export type { RateLimitResult };
