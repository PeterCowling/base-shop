// src/lib/rates.ts
import { RatePlan, RatesData, RatesDataSchema, RateRow } from "@/types/rates";
import RATES from "@/data/rates/latest.json" assert { type: "json" };
import dayjs from "dayjs";
import { IS_DEV } from "@/config/env";

const CITY_TAX_PER_GUEST_PER_NIGHT = 2.5; // EUR

export function getRates(): RatesData {
  // Validate at runtime in dev to catch formatting issues
  const parsed = RatesDataSchema.safeParse(RATES);
  if (!parsed.success) {
    if (IS_DEV) {
      console.warn("Invalid rates data:", parsed.error.format()); // i18n-exempt -- DX-412 [ttl=2026-12-31]
    }
    // Fallback to a minimal empty structure to avoid hard crashes
    return { currency: "EUR", horizonStart: "1970-01-01", horizonEnd: "1970-01-01", rows: [] };
  }
  return parsed.data;
}

export function listNights(checkin: string, checkout: string): string[] {
  const start = dayjs(checkin);
  const end = dayjs(checkout);
  const nights: string[] = [];
  for (let d = start; d.isBefore(end); d = d.add(1, "day")) {
    nights.push(d.format("YYYY-MM-DD"));
  }
  return nights;
}

export function findNightlyPrices(
  sku: string,
  plan: RatePlan,
  nights: string[]
): { prices: number[]; allAvailable: boolean } {
  const { rows } = getRates();
  const byKey = new Map<string, RateRow>();
  for (const row of rows) {
    if (row.sku === sku && row.plan === plan) {
      byKey.set(`${row.date}|${row.sku}|${row.plan}`, row);
    }
  }

  const prices: number[] = [];
  let allAvailable = true;
  for (const day of nights) {
    const hit = byKey.get(`${day}|${sku}|${plan}`);
    if (!hit || !hit.available) {
      allAvailable = false;
      // Still push a 0 to keep array length consistent; caller may choose to treat as sold out
      prices.push(0);
    } else {
      prices.push(hit.price);
    }
  }
  return { prices, allAvailable };
}

export function cityTaxFor(adults: number, nights: number): number {
  return CITY_TAX_PER_GUEST_PER_NIGHT * adults * nights;
}
