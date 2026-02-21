import type { BookingChannel, BookingsByChannelRow } from "./octorate-bookings.js";

export type CommissionRateSource = "estimated" | "contractual";

export type CommissionRate = {
  channel: BookingChannel;
  rate: number; // decimal fraction, e.g. 0.15
  rate_source: CommissionRateSource;
  rate_last_verified_at: string; // YYYY-MM-DD
  source: string;
};

export type CommissionRatesConfig = {
  currency: string;
  rates: CommissionRate[];
};

export type CommissionByChannelRow = {
  month: string; // YYYY-MM
  channel: BookingChannel;
  commission_amount: number;
  currency: string;
  effective_take_rate: number;
  notes: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function requireIsoDate(iso: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`invalid_iso_date:${iso}`);
  }
}

function indexRates(config: CommissionRatesConfig): Map<BookingChannel, CommissionRate> {
  if (!config || typeof config !== "object") {
    throw new Error("invalid_rates_config");
  }
  if (typeof config.currency !== "string" || !config.currency.trim()) {
    throw new Error("invalid_rates_config_currency");
  }
  if (!Array.isArray(config.rates)) {
    throw new Error("invalid_rates_config_rates");
  }

  const map = new Map<BookingChannel, CommissionRate>();

  for (const entry of config.rates) {
    if (!entry || typeof entry !== "object") {
      throw new Error("invalid_rate_entry");
    }
    if (typeof entry.channel !== "string") {
      throw new Error("invalid_rate_channel");
    }
    if (typeof entry.rate !== "number" || !Number.isFinite(entry.rate) || entry.rate < 0) {
      throw new Error(`invalid_rate_value:${String((entry as { rate?: unknown }).rate)}`);
    }
    if (entry.rate_source !== "estimated" && entry.rate_source !== "contractual") {
      throw new Error(`invalid_rate_source:${String((entry as { rate_source?: unknown }).rate_source)}`);
    }
    if (typeof entry.rate_last_verified_at !== "string") {
      throw new Error("invalid_rate_last_verified_at");
    }
    requireIsoDate(entry.rate_last_verified_at);
    if (typeof entry.source !== "string" || !entry.source.trim()) {
      throw new Error("invalid_rate_source_field");
    }

    // Last-write-wins in config, but we still keep deterministic behavior.
    map.set(entry.channel as BookingChannel, entry as CommissionRate);
  }

  return map;
}

export function deriveCommissionByChannel(
  bookingsRows: Array<Pick<BookingsByChannelRow, "month" | "channel" | "gross_value">>,
  ratesConfig: CommissionRatesConfig,
): CommissionByChannelRow[] {
  const rates = indexRates(ratesConfig);

  return bookingsRows.map((row) => {
    const rateEntry = rates.get(row.channel);
    if (!rateEntry) {
      throw new Error(`missing_rate_for_channel:${row.channel}`);
    }

    const gross = typeof row.gross_value === "number" && Number.isFinite(row.gross_value) ? row.gross_value : 0;

    const commissionAmount = row.channel === "Direct" ? 0 : round2(gross * rateEntry.rate);
    const takeRate = gross === 0 ? 0 : round4(commissionAmount / gross);

    const notesParts = [
      `rate=${rateEntry.rate}`,
      `rate_source=${rateEntry.rate_source}`,
      `rate_last_verified_at=${rateEntry.rate_last_verified_at}`,
      `rate_config_source=${rateEntry.source}`,
    ];

    if (gross === 0) {
      notesParts.push("gross_zero=true");
    }

    return {
      month: row.month,
      channel: row.channel,
      commission_amount: commissionAmount,
      currency: ratesConfig.currency,
      effective_take_rate: takeRate,
      notes: notesParts.join("; "),
    };
  });
}

export function commissionByChannelRowsToCsv(rows: CommissionByChannelRow[]): string {
  const header = [
    "month",
    "channel",
    "commission_amount",
    "currency",
    "effective_take_rate",
    "notes",
  ].join(",");

  const lines = [header];
  for (const r of rows) {
    const safeNotes = String(r.notes ?? "").replaceAll(",", " ");
    lines.push(
      [
        r.month,
        r.channel,
        r.commission_amount.toFixed(2),
        r.currency,
        r.effective_take_rate.toFixed(4),
        safeNotes,
      ].join(","),
    );
  }

  return lines.join("\n") + "\n";
}
