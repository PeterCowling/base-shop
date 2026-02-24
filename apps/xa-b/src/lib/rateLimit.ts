import fs from "node:fs";
import path from "node:path";

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
  var __xaRateLimitStoreHydrated: boolean | undefined;
}

const RATE_LIMIT_STORE_PATH =
  process.env.XA_RATE_LIMIT_STORE_PATH ??
  path.join(process.cwd(), "data", "access", "rate-limit-store.json");
const PERSIST_RATE_LIMIT = process.env.XA_PERSIST_RATE_LIMIT !== "false";
const MAX_STORE_ENTRIES = 10000;

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function shouldTrustProxyHeaders() {
  return parseBool(process.env.XA_TRUST_PROXY_IP_HEADERS);
}

function isValidIpv4(value: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return false;
  return value.split(".").every((segment) => {
    const part = Number.parseInt(segment, 10);
    return Number.isFinite(part) && part >= 0 && part <= 255;
  });
}

function isValidIpv6(value: string): boolean {
  const colonCount = (value.match(/:/g) ?? []).length;
  if (colonCount < 2) return false;
  return /^[a-fA-F0-9:.]+$/.test(value);
}

function normalizeIpCandidate(raw: string | null): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const first = trimmed.split(",")[0]?.trim() ?? "";
  if (!first) return "";

  if (first.startsWith("[") && first.includes("]")) {
    const bracketed = first.slice(1, first.indexOf("]")).trim();
    return isValidIpv6(bracketed) ? bracketed : "";
  }

  if (isValidIpv6(first)) return first;

  const withoutPort = first.includes(":") ? first.split(":")[0]?.trim() ?? "" : first;
  return isValidIpv4(withoutPort) ? withoutPort : "";
}

function readStoreFromDisk(now: number) {
  const raw = fs.readFileSync(RATE_LIMIT_STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, Partial<RateLimitEntry>>;

  const store = new Map<string, RateLimitEntry>();
  for (const [key, value] of Object.entries(parsed)) {
    const count = typeof value.count === "number" ? value.count : Number(value.count);
    const resetAt =
      typeof value.resetAt === "number" ? value.resetAt : Number(value.resetAt);
    if (!Number.isFinite(count) || count <= 0) continue;
    if (!Number.isFinite(resetAt) || resetAt <= now) continue;
    store.set(key, { count: Math.floor(count), resetAt: Math.floor(resetAt) });
  }
  return store;
}

function writeStoreToDisk(store: Map<string, RateLimitEntry>, now: number) {
  const serialized: Record<string, RateLimitEntry> = {};
  let entries = 0;

  for (const [key, value] of store) {
    if (value.resetAt <= now) continue;
    serialized[key] = value;
    entries += 1;
    if (entries >= MAX_STORE_ENTRIES) break;
  }

  fs.mkdirSync(path.dirname(RATE_LIMIT_STORE_PATH), { recursive: true });
  const tempPath = `${RATE_LIMIT_STORE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(serialized), "utf-8");
  fs.renameSync(tempPath, RATE_LIMIT_STORE_PATH);
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, value] of store) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

function hydrateStore() {
  if (globalThis.__xaRateLimitStoreHydrated) return;
  globalThis.__xaRateLimitStoreHydrated = true;

  if (!PERSIST_RATE_LIMIT) return;

  try {
    const hydrated = readStoreFromDisk(Date.now());
    globalThis.__xaRateLimitStore = hydrated;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== "ENOENT") {
      // i18n-exempt -- XA-0110: technical warning
      console.warn("Failed to hydrate XA rate-limit store from disk.");
    }
  }
}

function getStore() {
  hydrateStore();

  if (!globalThis.__xaRateLimitStore) {
    globalThis.__xaRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalThis.__xaRateLimitStore;
}

function persistStore(store: Map<string, RateLimitEntry>, now: number) {
  if (!PERSIST_RATE_LIMIT) return;

  try {
    writeStoreToDisk(store, now);
  } catch {
    // i18n-exempt -- XA-0110: technical warning
    console.warn("Failed to persist XA rate-limit store.");
  }
}

export function getRequestIp(request: Request) {
  if (!shouldTrustProxyHeaders()) {
    return "";
  }

  const cfConnectingIp = normalizeIpCandidate(request.headers.get("cf-connecting-ip"));
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = normalizeIpCandidate(request.headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  return normalizeIpCandidate(request.headers.get("x-real-ip"));
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

  pruneExpiredEntries(store, now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    persistStore(store, now);
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt,
      retryAfter: 0,
    };
  }

  const updated = { ...existing, count: existing.count + 1 };
  store.set(key, updated);

  if (store.size > MAX_STORE_ENTRIES) {
    pruneExpiredEntries(store, now);
  }

  persistStore(store, now);

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
