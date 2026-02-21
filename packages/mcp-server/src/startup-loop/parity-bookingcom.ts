import type { ParityScenario } from "./parity-direct.js";
import { requireIsoDate, round2 } from "./parity-direct.js";

export const BOOKINGCOM_SURFACE = "Booking.com" as const;

// Re-export shared header and utilities from parity-direct
export { PARITY_SCENARIOS_HEADER, parseNumberLike, requireIsoDate, requireOneOf, round2 } from "./parity-direct.js";

export type BookingcomParityRowInput = {
  scenario: ParityScenario;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  travellers: number;
  totalPriceAllIn: number; // -1 represents unavailable (extraction failed)
  currency: string;
  taxesFeesClarity: string;
  cancellationCutoff: string;
  captureMode: "auto";
  capturedAtIso: string; // ISO timestamp
  evidenceUrl: string;
  failureReason?: string; // Present when totalPriceAllIn === -1
};

export function buildBookingcomUrl(args: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
}): string {
  requireIsoDate(args.checkIn, "check_in");
  requireIsoDate(args.checkOut, "check_out");

  // Booking.com URL pattern with dates as query params
  // BRIK is in Italy, uses .en-gb.html suffix for English
  const u = new URL(`https://www.booking.com/hotel/it/${args.propertyId}.en-gb.html`);
  u.searchParams.set("checkin", args.checkIn);
  u.searchParams.set("checkout", args.checkOut);
  u.searchParams.set("group_adults", String(args.travellers));
  u.searchParams.set("group_children", "0");
  u.searchParams.set("no_rooms", "1");
  u.searchParams.set("selected_currency", "EUR");

  return u.toString();
}

export function buildBookingcomParityCsvRow(input: BookingcomParityRowInput): string {
  requireIsoDate(input.checkIn, "check_in");
  requireIsoDate(input.checkOut, "check_out");

  if (!Number.isInteger(input.travellers) || input.travellers <= 0) {
    throw new Error(`invalid_travellers:${String(input.travellers)}`);
  }

  const currency = String(input.currency ?? "").trim().toUpperCase();
  if (currency.length !== 3) {
    throw new Error(`invalid_currency:${String(input.currency)}`);
  }

  const currencyMismatch = currency !== "EUR";
  const isUnavailable = input.totalPriceAllIn === -1;

  const notesTokens = [
    `capture_mode=${input.captureMode}`,
    `captured_at=${input.capturedAtIso}`,
    "source=booking",
    currencyMismatch ? "currency_mismatch=true" : "currency_mismatch=false",
  ];

  if (isUnavailable && input.failureReason) {
    notesTokens.push(`failure_reason=${input.failureReason.replaceAll(";", " ").replaceAll(",", " ")}`);
  }

  const notes = notesTokens.join("; ");

  const safeTaxes = String(input.taxesFeesClarity ?? "unknown").replaceAll(",", " ");
  const safeCutoff = String(input.cancellationCutoff ?? "").replaceAll(",", " ");
  const safeNotes = notes.replaceAll(",", " ");
  const safeEvidence = String(input.evidenceUrl ?? "").replaceAll(",", " ");

  const priceValue = isUnavailable ? "unavailable" : round2(input.totalPriceAllIn).toFixed(2);

  return [
    input.scenario,
    BOOKINGCOM_SURFACE,
    input.checkIn,
    input.checkOut,
    String(input.travellers),
    priceValue,
    currency,
    safeTaxes,
    safeCutoff,
    "", // deposit_payment (Booking.com doesn't use deposit split like Hostelworld)
    safeNotes,
    safeEvidence,
  ].join(",");
}
