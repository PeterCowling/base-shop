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
