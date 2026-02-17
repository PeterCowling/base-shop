// src/context/modal/payloadMap.ts
/* -------------------------------------------------------------------------- */
/*  Typed modal payload registry — authoritative for apps/brikette.           */
/*  packages/ui remains generic; Brikette-specific payload definitions live   */
/*  here. packages/ui must not import these types (TASK-01 Option A).         */
/* -------------------------------------------------------------------------- */

/** V1 booking modal — general availability check with optional prefill */
export interface BookingPayload {
  /** Pre-fill check-in date (YYYY-MM-DD) from BookingWidget */
  checkIn?: string;
  /** Pre-fill check-out date (YYYY-MM-DD) from BookingWidget */
  checkOut?: string;
  /** Pre-fill guest count from BookingWidget */
  adults?: number;
  /** Deal promo code for deep-linked deal pages */
  deal?: string;
  /** Analytics source attribution */
  source?: string;
  /**
   * Room object when opening from a room-card context.
   * Currently unused by BookingGlobalModal consumer — tracked here for drift prevention.
   */
  room?: unknown;
  /** Rate type when opening from a room-card context — currently unused by V1 consumer */
  rateType?: "nonRefundable" | "refundable";
}

/**
 * V2 booking modal — room-specific rate confirmation.
 * Deprecation target: merges into BookingPayload when TASK-05 host migration completes.
 */
export interface Booking2Payload {
  /** Pre-fill check-in date (YYYY-MM-DD) */
  checkIn?: string;
  /** Pre-fill check-out date (YYYY-MM-DD) */
  checkOut?: string;
  /** Pre-fill adult count */
  adults?: number;
  /** Octorate room SKU code */
  roomSku?: string;
  /** Booking plan type */
  plan?: "nr" | "flex";
  /** Octorate rate code for the selected room */
  octorateRateCode?: string;
  /** Analytics source attribution */
  source?: string;
  /** GA4 item list ID for impression tracking */
  item_list_id?: string;
  /** Rate type — informational, sourced from room card context */
  rateType?: "nonRefundable" | "refundable";
  /**
   * Full room object when opening from a room-card context.
   * Typed as unknown to avoid importing Room from a non-modal package scope.
   * Consumers use roomSku/plan/octorateRateCode instead of the raw room object.
   */
  room?: unknown;
}

/** Location modal — optional hostel address prefill for map context */
export interface LocationPayload {
  hostelAddress?: string;
}

/**
 * Authoritative modal payload map for apps/brikette.
 *
 * Keys must match ModalType values from @acme/ui/context/ModalContext.
 * `undefined` payload means the modal requires no caller-supplied data.
 *
 * Convergence note (TASK-02 Option B): booking2 is the migration-window compat
 * key. Target state after TASK-05 host migration: one unified "booking" key.
 * "booking2" is removed in TASK-10.
 */
export type ModalPayloadMap = {
  booking: BookingPayload;
  booking2: Booking2Payload;
  location: LocationPayload;
  offers: undefined;
  contact: undefined;
  facilities: undefined;
  language: undefined;
};

// ---------------------------------------------------------------------------
// Boundary validators — for externally sourced payloads (URL/query/storage).
// Internal call sites are compile-time enforced via TypedOpenModal.
// ---------------------------------------------------------------------------

// -- Field-level helpers (reduce branching in validators) --

function optString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function optNumber(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

type RateType = "nonRefundable" | "refundable";

function parseRateType(v: unknown): RateType | undefined {
  return v === "nonRefundable" || v === "refundable" ? v : undefined;
}

function parsePlan(v: unknown): "nr" | "flex" | undefined {
  return v === "nr" || v === "flex" ? v : undefined;
}

// -- Guard helpers (reject malformed fields early) --

function isValidRateTypeField(obj: Record<string, unknown>): boolean {
  if (!("rateType" in obj)) return true;
  const v = obj.rateType;
  return v === undefined || v === "nonRefundable" || v === "refundable";
}

function isValidAdultsField(obj: Record<string, unknown>): boolean {
  if (!("adults" in obj)) return true;
  const v = obj.adults;
  return v === undefined || typeof v === "number";
}

function isValidPlanField(obj: Record<string, unknown>): boolean {
  if (!("plan" in obj)) return true;
  const v = obj.plan;
  return v === undefined || v === "nr" || v === "flex";
}

/**
 * Validate an externally sourced booking2 payload.
 * Returns typed payload if valid, null if malformed.
 */
export function parseBooking2Payload(raw: unknown): Booking2Payload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (!isValidPlanField(obj)) return null;
  if (!isValidAdultsField(obj)) return null;
  if (!isValidRateTypeField(obj)) return null;

  return {
    checkIn: optString(obj.checkIn),
    checkOut: optString(obj.checkOut),
    adults: optNumber(obj.adults),
    roomSku: optString(obj.roomSku),
    plan: parsePlan(obj.plan),
    octorateRateCode: optString(obj.octorateRateCode),
    source: optString(obj.source),
    item_list_id: optString(obj.item_list_id),
    rateType: parseRateType(obj.rateType),
  };
}

/**
 * Validate an externally sourced booking payload.
 * Returns typed payload if valid, null if malformed.
 */
export function parseBookingPayload(raw: unknown): BookingPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (!isValidRateTypeField(obj)) return null;
  if (!isValidAdultsField(obj)) return null;

  return {
    checkIn: optString(obj.checkIn),
    checkOut: optString(obj.checkOut),
    adults: optNumber(obj.adults),
    deal: optString(obj.deal),
    source: optString(obj.source),
    rateType: parseRateType(obj.rateType),
  };
}
