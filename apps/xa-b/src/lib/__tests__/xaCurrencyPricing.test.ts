import { describe, expect, it } from "@jest/globals";

import type { Currency } from "@acme/platform-core/contexts/CurrencyContext";

type PriceMap = Partial<Record<Currency, number>>;

// Helper mirroring the pattern used in XaBuyBox, XaProductCard, cart/page, checkout/page
function getEffectivePrice(
  prices: PriceMap | undefined,
  currency: Currency,
  fallback: number,
): number {
  return prices?.[currency] ?? fallback;
}

describe("per-currency price fallback", () => {
  it("returns the per-currency price when present", () => {
    expect(getEffectivePrice({ EUR: 10974 }, "EUR", 11800)).toBe(10974);
  });

  it("returns fallback when currency not in prices", () => {
    expect(getEffectivePrice({ EUR: 10974 }, "GBP", 11800)).toBe(11800);
  });

  it("returns fallback when prices is undefined", () => {
    expect(getEffectivePrice(undefined, "EUR", 11800)).toBe(11800);
  });

  it("returns 0 (not fallback) when per-currency price is zero - preserves zero-priced products", () => {
    // This is the key test: ?? not ||
    expect(getEffectivePrice({ EUR: 0 }, "EUR", 11800)).toBe(0);
  });

  it("demonstrates why || would fail for zero-priced products", () => {
    const prices: PriceMap = { EUR: 0 };
    const fallback = 11800;
    // Correct (??): preserves zero
    expect(prices?.EUR ?? fallback).toBe(0);
    // Wrong (||): would return fallback instead of 0
    expect(prices?.EUR || fallback).toBe(11800);
  });
});
