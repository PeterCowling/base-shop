// apps/brikette/src/utils/recoveryQuoteCalc.ts
// Deterministic recovery quote calculation helper.
// Pure module — no `server-only` guard. Safe to import from both client and server contexts.
// Quote amounts use "from_price" mode only (indicative per-night × nights).
// Exact per-rate-plan totals are deferred until source contract expansion.

import indicativePrices from "@/data/indicative_prices.json";
import type { RecoveryQuoteContext } from "@/utils/recoveryQuote";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecoveryQuote = {
  /** Always "from_price" — exact plan totals are deferred. */
  mode: "from_price";
  /** Indicative per-night price in EUR, or null when unknown. */
  pricePerNight: number | null;
  /** Indicative total (pricePerNight × nights), or null when unavailable/zero nights. */
  totalFrom: number | null;
  /** Number of calendar nights between checkin and checkout. */
  nights: number;
  /** Always "EUR". */
  currency: "EUR";
  /**
   * Price data origin:
   * - "indicative" — price looked up from indicative_prices.json
   * - "live"       — reserved for future live availability lookup (not yet used)
   * - "none"       — room unknown or room_id absent; price not calculated
   */
  priceSource: "indicative" | "live" | "none";
};

type IndicativePriceEntry = { from: number };
type IndicativePricesData = {
  rooms: Record<string, IndicativePriceEntry | undefined>;
};

function countNights(checkin: string, checkout: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / msPerDay
  );
}

function lookupIndicativePrice(roomId: string | undefined): number | null {
  if (!roomId) return null;
  const data = indicativePrices as IndicativePricesData;
  const entry = data.rooms[roomId];
  return entry ? entry.from : null;
}

/**
 * Build a deterministic recovery quote from a booking context.
 *
 * Price is always "from_price" mode using indicative_prices.json as the source.
 * Returns priceSource="none" when the room_id is absent or not found in the
 * indicative price list — the quote is still valid and can be sent; the email
 * body should note that the price could not be calculated automatically.
 */
export function buildRecoveryQuote(
  context: RecoveryQuoteContext
): RecoveryQuote {
  const nights = countNights(context.checkin, context.checkout);
  const pricePerNight = lookupIndicativePrice(context.room_id);

  if (pricePerNight === null) {
    return {
      mode: "from_price",
      pricePerNight: null,
      totalFrom: null,
      nights,
      currency: "EUR",
      priceSource: "none",
    };
  }

  const totalFrom = nights > 0
    ? Math.round(pricePerNight * nights * 100) / 100
    : null;

  return {
    mode: "from_price",
    pricePerNight,
    totalFrom,
    nights,
    currency: "EUR",
    priceSource: "indicative",
  };
}

/**
 * Build a stable idempotency key for a recovery quote submission.
 *
 * Derived from: checkin, checkout, pax, room_id, rate_plan.
 * Does NOT include wall-clock time or random values — suitable as a dedup store key.
 * Format: "rq:<checkin>|<checkout>|<pax>|<room_id>|<rate_plan>"
 *
 * Note: cross-instance dedup is not guaranteed on Cloudflare free tier (no KV store).
 * This key is used for best-effort dedup within a single Worker instance.
 */
export function buildQuoteIdempotencyKey(context: RecoveryQuoteContext): string {
  const parts = [
    context.checkin,
    context.checkout,
    String(context.pax),
    context.room_id ?? "",
    context.rate_plan ?? "",
  ];
  return "rq:" + parts.join("|");
}
