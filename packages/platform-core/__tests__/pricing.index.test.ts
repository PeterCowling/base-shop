import { jest } from "@jest/globals";

const defaultPricing = {
  baseDailyRate: 10,
  durationDiscounts: [
    { minDays: 10, rate: 0.5 },
    { minDays: 5, rate: 0.8 },
  ],
  damageFees: { lost: "deposit", scuff: 20 },
  coverage: { scuff: { fee: 5, waiver: 10 } },
};

const defaultRates = {
  base: "USD",
  rates: { EUR: 0.5 },
};

async function setup(pricingData = defaultPricing, rateData = defaultRates) {
  jest.resetModules();
  jest.doMock("../src/dataRoot", () => ({ resolveDataRoot: () => "" }));
  const readFile = jest.fn(async (file: string) => {
    if (file.includes("pricing.json")) return JSON.stringify(pricingData);
    if (file.includes("exchangeRates.json")) return JSON.stringify(rateData);
    throw new Error(`Unexpected file: ${file}`);
  });
  const actualFs = jest.requireActual("node:fs");
  jest.doMock("node:fs", () => ({
    ...actualFs,
    promises: { ...actualFs.promises, readFile },
  }));
  const mod = await import("../src/pricing");
  return { ...mod, readFile };
}

describe("pricing index", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("getPricing caches file reads", async () => {
    const { getPricing, readFile } = await setup();
    await getPricing();
    expect(readFile).toHaveBeenCalledTimes(1);
    await getPricing();
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("convertCurrency handles base currency, missing rate, bankers rounding ties, and caches exchange rates", async () => {
    const { convertCurrency, readFile } = await setup(undefined, {
      base: "USD",
      rates: { EUR: 0.5 },
    });
    await expect(convertCurrency(5, "USD")).resolves.toBe(5);
    expect(readFile).toHaveBeenCalledTimes(1);
    await expect(convertCurrency(1, "EUR")).resolves.toBe(0);
    expect(readFile).toHaveBeenCalledTimes(1);
    await expect(convertCurrency(3, "EUR")).resolves.toBe(2);
    await expect(convertCurrency(1, "GBP")).rejects.toThrow(
      "Missing exchange rate for GBP",
    );
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("applyDurationDiscount selects the appropriate tier", async () => {
    jest.resetModules();
    const { applyDurationDiscount } = await import("../src/pricing");
    const discounts = [
      { minDays: 10, rate: 0.5 },
      { minDays: 5, rate: 0.8 },
    ];
    expect(applyDurationDiscount(100, 12, discounts)).toBe(50);
    expect(applyDurationDiscount(100, 7, discounts)).toBe(80);
    expect(applyDurationDiscount(100, 3, discounts)).toBe(100);
  });

  it("computeDamageFee handles rule types and coverage", async () => {
    const { computeDamageFee } = await setup();
    await expect(computeDamageFee(undefined, 50)).resolves.toBe(0);
    await expect(computeDamageFee(15, 50)).resolves.toBe(15);
    await expect(computeDamageFee("lost", 50)).resolves.toBe(50);
    await expect(computeDamageFee("scuff", 50, ["scuff"])).resolves.toBe(10);
    await expect(computeDamageFee("scuff", 50)).resolves.toBe(20);
  });
});
