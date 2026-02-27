export type DealValidityAppliesTo = "stay_dates" | "booking_dates";

export type DealRateType = "non_refundable" | "refundable" | "any";

export type DealRules = {
  minDaysAhead?: number;
  minNights?: number;
  maxNights?: number;
  rateType?: DealRateType;
  directOnly?: boolean;
  stacksWithDirectDiscount?: boolean;
};

export type DealValidity = {
  appliesTo: DealValidityAppliesTo;
  windowStart: string; // YYYY-MM-DD
  windowEnd: string; // YYYY-MM-DD
};

export type DealConfig = {
  id: string;
  discountPct: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (inclusive)
  validity: DealValidity;
  rules: DealRules;
};

export const DEALS = [
  {
    id: "direct-perks-evergreen",
    discountPct: 25,
    startDate: "2026-02-27",
    endDate: "2099-12-31",
    validity: {
      appliesTo: "booking_dates",
      windowStart: "2026-02-27",
      windowEnd: "2099-12-31",
    },
    rules: {
      rateType: "any",
      directOnly: true,
      stacksWithDirectDiscount: false,
    },
  },
  {
    id: "sep20_oct31_15off",
    discountPct: 15,
    startDate: "2025-09-20",
    endDate: "2025-10-31",
    validity: {
      appliesTo: "stay_dates",
      windowStart: "2025-09-20",
      windowEnd: "2025-10-31",
    },
    rules: {
      minDaysAhead: 10,
      minNights: 2,
      maxNights: 8,
      rateType: "non_refundable",
      directOnly: true,
      stacksWithDirectDiscount: true,
    },
  },
] as const satisfies readonly [DealConfig, ...DealConfig[]];

export const PRIMARY_DEAL = DEALS[0];

export function getActiveDealCount(deals: readonly DealConfig[], date: Date): number {
  return deals.filter(
    (d) => new Date(d.startDate) <= date && new Date(d.endDate) >= date,
  ).length;
}
