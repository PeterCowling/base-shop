/**
 * In-process IP-based rate limiter for CF Workers / Node.
 *
 * Uses a sliding-window counter per IP stored in a module-level Map.
 * Within a CF Worker isolate this is per-isolate, not globally consistent —
 * sufficient for spam / email-abuse prevention on low-traffic endpoints.
 *
 * Usage:
 *   const allowed = checkRateLimit(ip, { max: 5, windowMs: 60_000 });
 *   if (!allowed) return new NextResponse("Too many requests", { status: 429 });
 */

type Entry = { count: number; resetAt: number };

const _store = new Map<string, Entry>();

/** Remove expired entries. Called lazily on every check to avoid setInterval in Workers. */
function _evict(now: number): void {
  if (_store.size < 512) return; // skip until store is large enough to matter
  for (const [key, entry] of _store) {
    if (now > entry.resetAt) _store.delete(key);
  }
}

/**
 * Returns true if the request is within the rate limit, false if it should be rejected.
 *
 * @param ip      Client IP string (use CF-Connecting-IP header in production).
 * @param max     Maximum requests allowed per window. Default 10.
 * @param windowMs Sliding window duration in ms. Default 60 seconds.
 */
export function checkRateLimit(
  ip: string,
  { max = 10, windowMs = 60_000 }: { max?: number; windowMs?: number } = {},
): boolean {
  const now = Date.now();
  _evict(now);

  const entry = _store.get(ip);

  if (!entry || now > entry.resetAt) {
    _store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count += 1;
  return true;
}

/** Extract best-available client IP from a Next.js/CF Workers request. */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
