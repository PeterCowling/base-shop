import type { RoomCardPrice } from "@acme/ui/types/roomCard";

type IndicativeRoomEntry = {
  from?: number;
};

type IndicativePricingSeed = {
  last_updated: string;
  basis?: string;
  stale_after_days?: number;
  rooms: Record<string, IndicativeRoomEntry>;
};

const DEFAULT_STALE_AFTER_DAYS = 14;
const DEFAULT_BASIS_LABEL = "per night"; // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed fallback label

const BASIS_LABEL_BY_TOKEN: Record<string, string> = {
  from_per_night: "per night", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
  per_night: "per night", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
  from_per_stay: "per stay", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
  per_stay: "per stay", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
  from_per_bed_per_night: "per bed per night", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
  per_bed_per_night: "per bed per night", // i18n-exempt -- ABC-123 [ttl=2026-12-31] machine seed token mapping
};

function isFreshSeed(seed: IndicativePricingSeed, nowMs: number = Date.now()): boolean {
  const staleAfterDays = Number(seed.stale_after_days ?? DEFAULT_STALE_AFTER_DAYS);
  const updatedAtMs = new Date(seed.last_updated).getTime();
  if (!Number.isFinite(updatedAtMs)) return false;
  const staleAfterMs = staleAfterDays * 24 * 60 * 60 * 1000;
  return nowMs - updatedAtMs <= staleAfterMs;
}

function normalizeBasisLabel(basis: string | undefined): string {
  const raw = (basis ?? "").trim().toLowerCase();
  if (!raw) return DEFAULT_BASIS_LABEL;

  const directLabel = BASIS_LABEL_BY_TOKEN[raw];
  if (directLabel) return directLabel;

  // Accept unknown token-like values and convert them to human-readable text.
  // Example: "from_per_night" -> "per night".
  const normalized = raw.startsWith("from_") ? raw.slice(5) : raw;
  return normalized.replaceAll("_", " ").trim() || DEFAULT_BASIS_LABEL;
}

export function getIndicativeRoomPrices(
  seed: IndicativePricingSeed,
  roomIds: string[],
): Record<string, RoomCardPrice> | undefined {
  if (!isFreshSeed(seed)) return undefined;
  const prices: Record<string, RoomCardPrice> = {};
  for (const roomId of roomIds) {
    const entry = seed.rooms[roomId];
    if (!entry?.from) continue;
    prices[roomId] = {
      formatted: `From €${entry.from.toFixed(2)}*`,
      soldOut: false,
    };
  }
  return Object.keys(prices).length > 0 ? prices : undefined;
}

export function getIndicativeAnchor(seed: IndicativePricingSeed, roomId: string): string | null {
  if (!isFreshSeed(seed)) return null;
  const entry = seed.rooms[roomId];
  if (!entry?.from) return null;
  return `From €${entry.from.toFixed(2)}*`;
}

export function getIndicativeDisclosure(seed: IndicativePricingSeed): string {
  const basis = normalizeBasisLabel(seed.basis);
  return `*Indicative “From” prices are ${basis} and non-binding. Last updated: ${seed.last_updated}.`;
}
