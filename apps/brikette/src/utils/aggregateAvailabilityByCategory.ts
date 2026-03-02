// apps/brikette/src/utils/aggregateAvailabilityByCategory.ts
// Aggregates multiple Octobook room sections sharing the same category name into a
// single synthetic OctorateRoom. Required because Octobook returns one section per
// rate-plan combination; a single Brikette room type may have multiple sections.

import type { OctorateRoom } from "@/types/octorate-availability";

/**
 * Aggregate all Octobook sections matching `category` (by `octorateRoomName`)
 * into a single synthetic OctorateRoom.
 *
 * - Returns `undefined` when `category` is empty or no sections match.
 * - All sold-out: `available: false`, `priceFrom: null`.
 * - Any available: `available: true`, `priceFrom` = min non-null priceFrom across available sections.
 * - Returned record has `ratePlans: []` (synthetic — multiple sections, no single plan to surface).
 */
export function aggregateAvailabilityByCategory(
  rooms: OctorateRoom[],
  category: string,
): OctorateRoom | undefined {
  if (!category) return undefined;

  const matching = rooms.filter((r) => r.octorateRoomName === category);
  if (matching.length === 0) return undefined;

  const availableSections = matching.filter((r) => r.available);
  const available = availableSections.length > 0;

  let priceFrom: number | null = null;
  if (available) {
    const prices = availableSections
      .map((r) => r.priceFrom)
      .filter((p): p is number => p !== null);
    priceFrom = prices.length > 0 ? Math.min(...prices) : null;
  }

  return {
    octorateRoomName: category,
    // octorateRoomId is always "3" in live Octobook HTML — preserved here for type
    // compat only; do not use for matching downstream.
    octorateRoomId: matching[0].octorateRoomId,
    available,
    priceFrom,
    nights: matching[0].nights,
    ratePlans: [], // synthetic — no meaningful per-plan data to surface across sections
  };
}
