import "server-only";

import type { PricingMatrix, SKU } from "@types";
import { pricingSchema } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { resolveDataRoot } from "./dataRoot";

let cached: PricingMatrix | null = null;

export async function getPricing(): Promise<PricingMatrix> {
  if (cached) return cached;
  const file = path.join(resolveDataRoot(), "..", "rental", "pricing.json");
  const buf = await fs.readFile(file, "utf8");
  cached = pricingSchema.parse(JSON.parse(buf));
  return cached;
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
  deposit: number
): Promise<number> {
  if (kind == null) return 0;
  const pricing = await getPricing();
  if (typeof kind === "number") return kind;
  const rule = pricing.damageFees[kind];
  if (rule === "deposit") return deposit;
  if (typeof rule === "number") return rule;
  return 0;
}
