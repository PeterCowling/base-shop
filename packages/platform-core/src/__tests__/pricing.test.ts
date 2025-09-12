/** @jest-environment node */

import { promises as fs } from "node:fs";

describe("convertCurrency", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("throws when the target code is absent", async () => {
    jest.resetModules();
    const rates = { base: "USD", rates: { EUR: 1 } };
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify(rates));
    const { convertCurrency } = await import("../pricing");
    await expect(convertCurrency(1, "GBP")).rejects.toThrow(
      "Missing exchange rate for GBP"
    );
  });

  it(".5 fractions round to the nearest even integer", async () => {
    jest.resetModules();
    const rates = { base: "USD", rates: { EUR: 1.5, GBP: 2.5 } };
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify(rates));
    const { convertCurrency } = await import("../pricing");
    await expect(convertCurrency(1, "EUR")).resolves.toBe(2);
    await expect(convertCurrency(1, "GBP")).resolves.toBe(2);
  });

  it("returns the original amount when currencies match", async () => {
    jest.resetModules();
    const rates = { base: "USD", rates: { EUR: 1.5 } };
    jest.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify(rates));
    const { convertCurrency } = await import("../pricing");
    await expect(convertCurrency(42, "USD")).resolves.toBe(42);
  });
});

describe("computeDamageFee", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("handles numeric and deposit rules with coverage", async () => {
    jest.resetModules();
    const pricing = await import("../pricing");
    jest.spyOn(pricing, "getPricing").mockResolvedValue({
      damageFees: { scuff: 100, tear: "deposit" },
      coverage: {
        scuff: { fee: 0, waiver: 80 },
        tear: { fee: 0, waiver: 80 },
      },
    } as any);

    await expect(pricing.computeDamageFee("scuff", 0)).resolves.toBe(100);
    await expect(
      pricing.computeDamageFee("scuff", 0, ["scuff"])
    ).resolves.toBe(20);
    await expect(pricing.computeDamageFee("tear", 50)).resolves.toBe(50);
    await expect(
      pricing.computeDamageFee("tear", 50, ["tear"])
    ).resolves.toBe(0);
  });
});

