import runtimeMeta from "../data/catalog.runtime.meta.json";

export const XA_CATALOG_RUNTIME_META = runtimeMeta as {
  source?: string;
  syncedAt?: string;
  version?: string;
  publishedAt?: string;
};

function resolveCatalogMaxAgeMs(): number {
  const raw = Number.parseInt(process.env.NEXT_PUBLIC_XA_CATALOG_MAX_AGE_HOURS ?? "48", 10);
  const safeHours = Number.isFinite(raw) && raw > 0 ? raw : 48;
  return safeHours * 60 * 60 * 1000;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const syncedAtMs = parseTimestamp(XA_CATALOG_RUNTIME_META.syncedAt);

export const XA_CATALOG_RUNTIME_FRESHNESS = {
  syncedAt: XA_CATALOG_RUNTIME_META.syncedAt,
  ageMs: syncedAtMs === null ? null : Math.max(0, Date.now() - syncedAtMs),
  isStale:
    syncedAtMs === null ? true : Date.now() - syncedAtMs > resolveCatalogMaxAgeMs(),
};
