import type { NextResponse } from "next/server";

import { toPositiveInt } from "@acme/lib";


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
  var __xaUploaderRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const MAX_ENTRIES = toPositiveInt(process.env.XA_UPLOADER_RATE_LIMIT_MAX_KEYS, 20_000, 1);

function getStore() {
  if (!globalThis.__xaUploaderRateLimitStore) {
    globalThis.__xaUploaderRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalThis.__xaUploaderRateLimitStore;
}

function pruneStore(now: number) {
  const store = getStore();
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_ENTRIES) return;

  const overflow = store.size - MAX_ENTRIES;
  const candidates = [...store.entries()]
    .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt)
    .slice(0, overflow);
  for (const [key] of candidates) {
    store.delete(key);
  }
}

export { getTrustedRequestIp as getRequestIp } from "./requestIp";

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
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) {
    headers.set("Retry-After", String(result.retryAfter));
  }
}

export function __clearRateLimitStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  getStore().clear();
}

export type { RateLimitResult };
