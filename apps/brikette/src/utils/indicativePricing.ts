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

function isFreshSeed(seed: IndicativePricingSeed, nowMs: number = Date.now()): boolean {
  const staleAfterDays = Number(seed.stale_after_days ?? DEFAULT_STALE_AFTER_DAYS);
  const updatedAtMs = new Date(seed.last_updated).getTime();
  if (!Number.isFinite(updatedAtMs)) return false;
  const staleAfterMs = staleAfterDays * 24 * 60 * 60 * 1000;
  return nowMs - updatedAtMs <= staleAfterMs;
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
  const basis = (seed.basis ?? "per night").toString();
  return `*Indicative “From” prices are ${basis} and non-binding. Last updated: ${seed.last_updated}.`;
}
