import "server-only";

import type { PricingMatrix, SKU } from "@acme/types";
import { pricingSchema } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "./dataRoot";

let cached: PricingMatrix | null = null;
let rateCache: { base: string; rates: Record<string, number> } | null = null;

export async function getPricing(): Promise<PricingMatrix> {
  if (cached) return cached;
  const file = path.join(resolveDataRoot(), "..", "rental", "pricing.json");
  const buf = await fs.readFile(file, "utf8");
  cached = pricingSchema.parse(JSON.parse(buf));
  return cached;
}

async function loadExchangeRates() {
  if (rateCache) return rateCache;
  const file = path.join(resolveDataRoot(), "..", "rental", "exchangeRates.json");
  const buf = await fs.readFile(file, "utf8");
  rateCache = JSON.parse(buf) as { base: string; rates: Record<string, number> };
  return rateCache;
}

/** Convert an amount from the base currency to the target currency */
export async function convertCurrency(
  amount: number,
  to: string
): Promise<number> {
  const { base, rates } = await loadExchangeRates();
  if (to === base) return amount;
  const rate = rates[to];
  if (!rate) throw new Error(`Missing exchange rate for ${to}`);
  return Math.round(amount * rate);
}

export function applyDurationDiscount(
  baseRate: number,
  days: number,
  discounts: { minDays: number; rate: number }[]
): number {
  const sorted = [...discounts].sort((a, b) => b.minDays - a.minDays);
  for (const d of sorted) {
    if (days >= d.minDays) return Math.round(baseRate * d.rate);
  }
  return baseRate;
}

export async function priceForDays(sku: SKU, days: number): Promise<number> {
  const pricing = await getPricing();
  const base = sku.dailyRate ?? sku.price ?? pricing.baseDailyRate;
  const rate = applyDurationDiscount(base, days, pricing.durationDiscounts);
  return rate * days;
}

export async function computeDamageFee(
  kind: string | number | undefined,
  deposit: number,
  coverageCodes: string[] = [],
): Promise<number> {
  if (kind == null) return 0;
  const pricing = await getPricing();
  if (typeof kind === "number") return kind;
  const rule = pricing.damageFees[kind];

  let fee = 0;
  if (rule === "deposit") {
    fee = deposit;
  } else if (typeof rule === "number") {
    fee = rule;
  }

  if (coverageCodes.length && pricing.coverage) {
    const coverage = coverageCodes.includes(kind)
      ? pricing.coverage[kind]
      : undefined;
    if (coverage && typeof rule === "number") {
      fee = Math.max(0, fee - coverage.waiver);
    }
  }

  return fee;
}
