import type { ParityScenario } from "./parity-direct.js";
import { requireIsoDate, round2 } from "./parity-direct.js";

export const HOSTELWORLD_SURFACE = "Hostelworld" as const;

// Re-export shared header and utilities from parity-direct
export { PARITY_SCENARIOS_HEADER, parseNumberLike, requireIsoDate, requireOneOf, round2 } from "./parity-direct.js";

export type HostelworldParityRowInput = {
  scenario: ParityScenario;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  travellers: number;
  totalPriceAllIn: number; // -1 represents unavailable (extraction failed)
  depositAmount: number; // Deposit component
  payAtPropertyAmount: number; // Pay-at-property component
  currency: string;
  taxesFeesClarity: string;
  cancellationCutoff: string;
  captureMode: "auto";
  capturedAtIso: string; // ISO timestamp
  evidenceUrl: string;
  failureReason?: string; // Present when totalPriceAllIn === -1
};

export function buildHostelworldUrl(args: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
}): string {
  requireIsoDate(args.checkIn, "check_in");
  requireIsoDate(args.checkOut, "check_out");

  // Hostelworld URL pattern with dates as query params
  const u = new URL(`https://www.hostelworld.com/pwa/hosteldetails.php/${args.propertyId}/hostel-brikette`);
  u.searchParams.set("dateFrom", args.checkIn);
  u.searchParams.set("dateTo", args.checkOut);
  u.searchParams.set("number_of_guests", String(args.travellers));

  return u.toString();
}

export function buildHostelworldParityCsvRow(input: HostelworldParityRowInput): string {
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
    "source=hostelworld",
    currencyMismatch ? "currency_mismatch=true" : "currency_mismatch=false",
  ];

  if (isUnavailable && input.failureReason) {
    notesTokens.push(`failure_reason=${input.failureReason.replaceAll(";", " ").replaceAll(",", " ")}`);
  }

  const notes = notesTokens.join("; ");

  // deposit_payment captures deposit + pay-at-property components
  const depositPayment =
    input.depositAmount > 0 || input.payAtPropertyAmount > 0
      ? `deposit_amount=${round2(input.depositAmount).toFixed(2)}; pay_at_property=${round2(input.payAtPropertyAmount).toFixed(2)}`
      : "";

  const safeTaxes = String(input.taxesFeesClarity ?? "unknown").replaceAll(",", " ");
  const safeCutoff = String(input.cancellationCutoff ?? "").replaceAll(",", " ");
  const safeNotes = notes.replaceAll(",", " ");
  const safeEvidence = String(input.evidenceUrl ?? "").replaceAll(",", " ");
  const safeDeposit = depositPayment.replaceAll(",", " ");

  const priceValue = isUnavailable ? "unavailable" : round2(input.totalPriceAllIn).toFixed(2);

  return [
    input.scenario,
    HOSTELWORLD_SURFACE,
    input.checkIn,
    input.checkOut,
    String(input.travellers),
    priceValue,
    currency,
    safeTaxes,
    safeCutoff,
    safeDeposit,
    safeNotes,
    safeEvidence,
  ].join(",");
}
