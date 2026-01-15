import type { Env } from "./index";

export type HostMode = "active" | "landing-only" | "expired" | "redirect-only";

export type HostMapping = {
  host: string;
  shopId: string;
  canonicalHost: string;
  defaultLocale: string;
  mode: HostMode;
  redirectTo?: string;
  expiresAt?: number | null;
};

type CacheEntry = { value: HostMapping | null; expiresAtMs: number };

const HOT_CACHE_MAX = 500;
const HOT_CACHE_TTL_MS = 30_000;
const HOT_CACHE_NEGATIVE_TTL_MS = 10_000;

const hotCache = new Map<string, CacheEntry>();

function getHot(host: string): HostMapping | null | undefined {
  const entry = hotCache.get(host);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAtMs) {
    hotCache.delete(host);
    return undefined;
  }
  hotCache.delete(host);
  hotCache.set(host, entry);
  return entry.value;
}

function setHot(host: string, value: HostMapping | null, ttlMs: number): void {
  const entry: CacheEntry = { value, expiresAtMs: Date.now() + ttlMs };
  if (hotCache.has(host)) hotCache.delete(host);
  hotCache.set(host, entry);
  while (hotCache.size > HOT_CACHE_MAX) {
    const oldest = hotCache.keys().next().value as string | undefined;
    if (!oldest) break;
    hotCache.delete(oldest);
  }
}

type HostMappingJson = Record<string, Omit<HostMapping, "host">>;

let lastEnvJson: string | undefined;
let lastEnvMap: HostMappingJson | undefined;

function loadEnvMap(env: Env): HostMappingJson | undefined {
  const raw = typeof env.HOST_MAPPING_JSON === "string" ? env.HOST_MAPPING_JSON : undefined;
  if (!raw || !raw.trim()) return undefined;
  if (raw === lastEnvJson) return lastEnvMap;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return undefined;
    lastEnvJson = raw;
    lastEnvMap = parsed as HostMappingJson;
    return lastEnvMap;
  } catch {
    return undefined;
  }
}

function kvKey(host: string): string {
  return `host:${host.toLowerCase()}`;
}

type KvRecord = { notFound?: true; mapping?: HostMapping; cachedAtMs: number };

function parseKvRecord(value: unknown): KvRecord | null {
  if (!value || typeof value !== "object") return null;
  const cachedAtMs = (value as { cachedAtMs?: unknown }).cachedAtMs;
  if (typeof cachedAtMs !== "number" || !Number.isFinite(cachedAtMs)) return null;
  const notFound = (value as { notFound?: unknown }).notFound;
  const mapping = (value as { mapping?: unknown }).mapping;
  if (notFound === true) return { notFound: true, cachedAtMs };
  if (!mapping || typeof mapping !== "object") return null;
  return { mapping: mapping as HostMapping, cachedAtMs };
}

export async function resolveHostMapping(
  host: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<HostMapping | null> {
  const normalizedHost = host.toLowerCase();

  const hot = getHot(normalizedHost);
  if (hot !== undefined) return hot;

  if (env.HOST_MAPPING_CACHE) {
    try {
      const raw = await env.HOST_MAPPING_CACHE.get(kvKey(normalizedHost), "json");
      const record = parseKvRecord(raw);
      if (record?.notFound) {
        setHot(normalizedHost, null, HOT_CACHE_NEGATIVE_TTL_MS);
        return null;
      }
      if (record?.mapping) {
        setHot(normalizedHost, record.mapping, HOT_CACHE_TTL_MS);
        return record.mapping;
      }
    } catch {
      // ignore KV failures; fall back to env/D1
    }
  }

  const envMap = loadEnvMap(env);
  const fromEnv = envMap?.[normalizedHost];
  if (fromEnv) {
    const mapping: HostMapping = { host: normalizedHost, ...fromEnv };
    setHot(normalizedHost, mapping, HOT_CACHE_TTL_MS);
    return mapping;
  }

  if (env.ROUTING_DB) {
    const mapping = await loadFromD1(normalizedHost, env);
    if (mapping) {
      setHot(normalizedHost, mapping, HOT_CACHE_TTL_MS);
      ctx.waitUntil(writeThroughKv(env, normalizedHost, mapping));
      return mapping;
    }
  }

  setHot(normalizedHost, null, HOT_CACHE_NEGATIVE_TTL_MS);
  ctx.waitUntil(writeNegativeKv(env, normalizedHost));
  return null;
}

async function writeNegativeKv(env: Env, host: string): Promise<void> {
  if (!env.HOST_MAPPING_CACHE) return;
  try {
    const record: KvRecord = { notFound: true, cachedAtMs: Date.now() };
    await env.HOST_MAPPING_CACHE.put(kvKey(host), JSON.stringify(record), { expirationTtl: 60 });
  } catch {
    // ignore
  }
}

async function writeThroughKv(env: Env, host: string, mapping: HostMapping): Promise<void> {
  if (!env.HOST_MAPPING_CACHE) return;
  try {
    const record: KvRecord = { mapping, cachedAtMs: Date.now() };
    await env.HOST_MAPPING_CACHE.put(kvKey(host), JSON.stringify(record), { expirationTtl: 300 });
  } catch {
    // ignore
  }
}

async function loadFromD1(host: string, env: Env): Promise<HostMapping | null> {
  if (!env.ROUTING_DB) return null;
  const result = await env.ROUTING_DB
    .prepare(
      "SELECT host, shop_id, canonical_host, default_locale, mode, redirect_to, expires_at FROM host_mappings WHERE host = ?1", // i18n-exempt -- FD-0001 [ttl=2026-12-31] SQL statement
    )
    .bind(host)
    .first();
  if (!result) return null;

  const shopId = (result as { shop_id?: unknown }).shop_id;
  const canonicalHost = (result as { canonical_host?: unknown }).canonical_host;
  const defaultLocale = (result as { default_locale?: unknown }).default_locale;
  const mode = (result as { mode?: unknown }).mode;
  const redirectTo = (result as { redirect_to?: unknown }).redirect_to;
  const expiresAt = (result as { expires_at?: unknown }).expires_at;

  if (typeof shopId !== "string" || !shopId) return null;
  if (typeof canonicalHost !== "string" || !canonicalHost) return null;
  if (typeof defaultLocale !== "string" || !defaultLocale) return null;
  if (typeof mode !== "string" || !mode) return null;

  return {
    host,
    shopId,
    canonicalHost,
    defaultLocale,
    mode: mode as HostMode,
    ...(typeof redirectTo === "string" && redirectTo ? { redirectTo } : {}),
    ...(typeof expiresAt === "number" && Number.isFinite(expiresAt) ? { expiresAt } : {}),
  };
}
