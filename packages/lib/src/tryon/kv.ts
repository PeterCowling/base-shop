// Minimal KV helper that works in Edge (Cloudflare) when a binding named TRYON_KV is provided.
// Falls back to null-ops when no binding is available.

type KvNamespace = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

type GlobalWithKv = typeof globalThis & {
  TRYON_KV?: KvNamespace;
  env?: { TRYON_KV?: KvNamespace };
  __env__?: { TRYON_KV?: KvNamespace };
};

function resolveKv(): KvNamespace | null {
  try {
    const g = globalThis as GlobalWithKv;
    if (g.TRYON_KV && typeof g.TRYON_KV.get === 'function') return g.TRYON_KV;
    if (g.env && g.env.TRYON_KV && typeof g.env.TRYON_KV.get === 'function') return g.env.TRYON_KV;
    if (g.__env__ && g.__env__.TRYON_KV && typeof g.__env__.TRYON_KV.get === 'function') return g.__env__.TRYON_KV;
    return null;
  } catch {
    return null;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const kv = resolveKv();
  if (!kv) return null;
  try { return await kv.get(key); } catch { return null; }
}

export async function kvPut(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const kv = resolveKv();
  if (!kv) return;
  try { await kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined); } catch { /* noop */ }
}

