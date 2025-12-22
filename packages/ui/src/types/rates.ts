// src/types/rates.ts
import { z } from "zod";

export const RatePlanSchema = z.enum(["flex", "nr"]);
export type RatePlan = z.infer<typeof RatePlanSchema>;

export const RateRowSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  sku: z.string(),
  plan: RatePlanSchema,
  price: z.number(), // nightly price before city tax
  available: z.boolean().default(true),
});

export type RateRow = z.infer<typeof RateRowSchema>;

export const RatesDataSchema = z.object({
  currency: z.literal("EUR"),
  horizonStart: z.string(), // YYYY-MM-DD
  horizonEnd: z.string(), // YYYY-MM-DD
  rows: z.array(RateRowSchema),
});

export type RatesData = z.infer<typeof RatesDataSchema>;

export interface QuoteTotals {
  nights: number;
  nightly: number[]; // list of nightly prices matched in order
  totalBeforeTax: number;
  cityTax: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Live-rate calendar (client-fetched JSON: /data/rates.json)
// Minimal shape required by utils/priceUtils and related tests.
// ---------------------------------------------------------------------------

export type DailyRate = {
  date: string; // YYYY-MM-DD
  nr: number; // non-refundable nightly price
  flex?: number; // optional flexible nightly price (present in some payloads/tests)
};

// Rates keyed by rate-code (e.g. direct NR, OTA NR, widget code, or room.id)
export type RateCalendar = Record<string, DailyRate[]>;
