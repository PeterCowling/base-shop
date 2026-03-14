interface KvRateLimitOptions {
  key: string;
  maxRequests: number;
  windowSeconds: number;
  errorMessage: string;
  kv?: KVNamespace;
}

function parseCounter(raw: string | null): number {
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildRateLimitExceededResponse(options: KvRateLimitOptions): Response {
  const resetAtEpochSeconds = Math.ceil((Date.now() + options.windowSeconds * 1000) / 1000);

  return new Response(JSON.stringify({ error: options.errorMessage }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Retry-After': String(options.windowSeconds),
      'X-RateLimit-Limit': String(options.maxRequests),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(resetAtEpochSeconds),
      'RateLimit-Limit': String(options.maxRequests),
      'RateLimit-Remaining': '0',
      'RateLimit-Reset': String(options.windowSeconds),
    },
  });
}

export async function enforceKvRateLimit(options: KvRateLimitOptions): Promise<Response | null> {
  if (!options.kv) {
    // KV binding is absent — rate limiting is disabled for this request.
    // This is expected in local dev but should not occur in production.
    // If this appears in CF logs, ensure the RATE_LIMIT KV namespace is bound to the Worker.
    console.warn('[kv-rate-limit] KV binding absent — rate limiting disabled for key:', options.key); // i18n-exempt -- PRIME-101 operator log [ttl=2026-12-31]
    return null;
  }

  const current = parseCounter(await options.kv.get(options.key));
  if (current >= options.maxRequests) {
    return buildRateLimitExceededResponse(options);
  }

  await options.kv.put(options.key, String(current + 1), {
    expirationTtl: options.windowSeconds,
  });
  return null;
}
