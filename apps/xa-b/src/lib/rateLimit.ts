type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

declare global {
  var __xaRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore() {
  if (!globalThis.__xaRateLimitStore) {
    globalThis.__xaRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalThis.__xaRateLimitStore;
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
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
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt,
      retryAfter: 0,
    };
  }

  const updated = { ...existing, count: existing.count + 1 };
  store.set(key, updated);
  const allowed = updated.count <= max;
  const remaining = Math.max(0, max - updated.count);
  const retryAfter = allowed ? 0 : Math.ceil((updated.resetAt - now) / 1000);
  return {
    allowed,
    remaining,
    resetAt: updated.resetAt,
    retryAfter,
  };
}

export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
) {
  headers.set("X-RateLimit-Remaining", `${result.remaining}`);
  headers.set("X-RateLimit-Reset", `${Math.ceil(result.resetAt / 1000)}`);
  if (!result.allowed) {
    headers.set("Retry-After", `${result.retryAfter}`);
  }
}

export type { RateLimitResult };
