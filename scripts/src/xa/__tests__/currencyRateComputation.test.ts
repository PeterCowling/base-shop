import { describe, expect, it } from "@jest/globals";

import { applyCurrencyRates } from "../run-xa-pipeline";

describe("applyCurrencyRates", () => {
  it("computes per-currency prices with Math.round applied", () => {
    expect(
      applyCurrencyRates(11800, { EUR: 0.93, GBP: 0.79, AUD: 1.55 }),
    ).toEqual({ USD: 11800, EUR: 10974, GBP: 9322, AUD: 18290 });
  });

  it("USD is always the input price unchanged", () => {
    expect(applyCurrencyRates(5000, { EUR: 0.90, GBP: 0.80, AUD: 1.50 }).USD).toBe(5000);
  });

  it("zero rate defaults to 1.0 (defensive fallback)", () => {
    const result = applyCurrencyRates(11800, { EUR: 0, GBP: -1, AUD: 1.55 });
    // Zero and negative rates treated as 1.0
    expect(result.EUR).toBe(11800);
    expect(result.GBP).toBe(11800);
    expect(result.AUD).toBe(18290);
  });

  it("non-finite rate defaults to 1.0", () => {
    const result = applyCurrencyRates(11800, { EUR: NaN, GBP: Infinity, AUD: 1.0 });
    expect(result.EUR).toBe(11800);
    expect(result.GBP).toBe(11800);
    expect(result.AUD).toBe(11800);
  });

  it("zero price produces all zero prices", () => {
    const result = applyCurrencyRates(0, { EUR: 0.93, GBP: 0.79, AUD: 1.55 });
    expect(result).toEqual({ USD: 0, EUR: 0, GBP: 0, AUD: 0 });
  });
});
