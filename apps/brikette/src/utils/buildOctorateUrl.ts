// src/utils/buildOctorateUrl.ts
/* -------------------------------------------------------------------------- */
/*  Pure URL builder for Octorate booking engine links.                       */
/*  No side-effects, no throws — always returns a discriminated-union result. */
/* -------------------------------------------------------------------------- */

const OCTORATE_BASE = "https://book.octorate.com/octobook/site/reservation";

export interface BuildOctorateUrlParams {
  /** Check-in date in YYYY-MM-DD format */
  checkin: string;
  /** Check-out date in YYYY-MM-DD format */
  checkout: string;
  /** Number of guests / pax */
  pax: number;
  /** Rate plan: non-refundable or flexible */
  plan: "nr" | "flex";
  /** The room SKU identifier (e.g. "double_room", "room_10") */
  roomSku: string;
  /** Octorate rate code for the specific plan (e.g. "433883"). Pass undefined to trigger error result. */
  octorateRateCode: string | undefined;
  /** The BOOKING_CODE constant (e.g. "45111") */
  bookingCode: string;
  /** Optional deal / coupon code — appends deal + UTM params when provided */
  deal?: string;
}

export type BuildOctorateUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: "missing_rate_code" | "missing_booking_code" | "invalid_dates" };

/**
 * Builds an Octorate booking engine URL for a specific room and rate plan.
 *
 * Returns `{ ok: true, url }` on success, or `{ ok: false, error }` on validation failure.
 * Never throws.
 *
 * - Uses Octorate room-rate `calendar.xhtml` endpoint.
 * - Appends room and date params from the selected room-rate/check-in.
 * - Appends deal + UTM attribution params when `deal` is provided.
 *
 * 200ms timeout rationale (for callers using trackThenNavigate): empirically-established
 * UX trade-off — short enough to feel near-instant, long enough for most browsers to
 * dispatch the beacon before page unload.
 */
export function buildOctorateUrl(
  params: BuildOctorateUrlParams
): BuildOctorateUrlResult {
  const { checkin, checkout, octorateRateCode, bookingCode, deal } = params;

  // Guard: booking code must be present
  if (!bookingCode || !bookingCode.trim()) {
    return { ok: false, error: "missing_booking_code" };
  }

  // Guard: rate code must be present and non-empty
  if (!octorateRateCode || !octorateRateCode.trim()) {
    return { ok: false, error: "missing_rate_code" };
  }

  // Guard: dates must be non-empty strings in YYYY-MM-DD format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkin) || !datePattern.test(checkout)) {
    return { ok: false, error: "invalid_dates" };
  }

  const urlParams = new URLSearchParams({
    codice: bookingCode,
    room: octorateRateCode,
    date: checkin,
  });

  // Preserve selected stay window for analytics/debug correlation.
  urlParams.set("checkin", checkin);
  urlParams.set("checkout", checkout);

  // Append deal attribution params when a deal code is provided
  const dealCode = typeof deal === "string" ? deal.trim() : "";
  if (dealCode) {
    urlParams.set("deal", dealCode);
    urlParams.set("utm_source", "site");
    urlParams.set("utm_medium", "deal");
    urlParams.set("utm_campaign", dealCode);
  }

  const url = `${OCTORATE_BASE}/calendar.xhtml?${urlParams.toString()}`;

  return { ok: true, url };
}
