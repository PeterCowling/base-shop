export const DIRECT_SURFACE = "Direct" as const;

export const PARITY_SCENARIOS_HEADER =
  "scenario,surface,check_in,check_out,travellers,total_price_all_in,currency,taxes_fees_clarity,cancellation_cutoff,deposit_payment,notes,evidence_url";

export type ParityScenario = "S1" | "S2" | "S3";

export type DirectParityRowInput = {
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function requireIsoDate(raw: string, label: string): void {
  if (typeof raw !== "string" || !ISO_DATE_RE.test(raw)) {
    throw new Error(`invalid_iso_date:${label}:${String(raw)}`);
  }
}

export function requireOneOf<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new Error(`invalid_${label}:${String(raw)}`);
  }
  return raw as T;
}

export function parseNumberLike(raw: string): number {
  const normalized = String(raw ?? "")
    .trim()
    .replaceAll("€", "")
    .replaceAll("EUR", "")
    .replaceAll(" ", "")
    .replaceAll(",", ".");

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid_number:${String(raw)}`);
  }
  return parsed;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildDirectUrl(args: { codice: string; checkIn: string; checkOut: string; pax: number; currency?: string }): string {
  requireIsoDate(args.checkIn, "check_in");
  requireIsoDate(args.checkOut, "check_out");

  const u = new URL("https://book.octorate.com/octobook/site/reservation/result.xhtml");
  u.searchParams.set("codice", args.codice);
  u.searchParams.set("checkin", args.checkIn);
  u.searchParams.set("checkout", args.checkOut);
  u.searchParams.set("pax", String(args.pax));
  if (args.currency) {
    u.searchParams.set("currency", args.currency);
  }
  return u.toString();
}

export function buildDirectParityCsvRow(input: DirectParityRowInput): string {
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
    "source=octorate",
    currencyMismatch ? "currency_mismatch=true" : "currency_mismatch=false",
  ];

  if (isUnavailable && input.failureReason) {
    notesTokens.push(`failure_reason=${input.failureReason.replaceAll(";", " ").replaceAll(",", " ")}`);
  }

  const notes = notesTokens.join("; ");

  // deposit_payment is intentionally blank for Direct.
  const deposit = "";

  const safeTaxes = String(input.taxesFeesClarity ?? "unknown").replaceAll(",", " ");
  const safeCutoff = String(input.cancellationCutoff ?? "").replaceAll(",", " ");
  const safeNotes = notes.replaceAll(",", " ");
  const safeEvidence = String(input.evidenceUrl ?? "").replaceAll(",", " ");

  const priceValue = isUnavailable ? "unavailable" : round2(input.totalPriceAllIn).toFixed(2);

  return [
    input.scenario,
    DIRECT_SURFACE,
    input.checkIn,
    input.checkOut,
    String(input.travellers),
    priceValue,
    currency,
    safeTaxes,
    safeCutoff,
    deposit,
    safeNotes,
    safeEvidence,
  ].join(",");
}
