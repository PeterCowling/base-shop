import { jest } from "@jest/globals";

const defaultPricing = {
  baseDailyRate: 10,
  durationDiscounts: [],
  damageFees: { lost: "deposit", scratch: 20 },
};

const defaultRates = {
  base: "USD",
  rates: { EUR: 0.5 },
};

async function setup(
  pricingData: any = defaultPricing,
  rateData: any = defaultRates
) {
  jest.resetModules();
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

describe("pricing utilities", () => {
  it("getPricing caches file contents", async () => {
    const { getPricing, readFile } = await setup();
    const first = await getPricing();
    const second = await getPricing();
    expect(first).toBe(second);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain("pricing.json");
  });

  it("convertCurrency caches exchange rates", async () => {
    const { convertCurrency, readFile } = await setup();
    await convertCurrency(100, "EUR");
    await convertCurrency(200, "EUR");
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain("exchangeRates.json");
  });

  it("convertCurrency handles rounding and missing rates", async () => {
    const { convertCurrency } = await setup(undefined, {
      base: "USD",
      rates: { EUR: 0.5 },
    });

    await expect(convertCurrency(101.3, "EUR")).resolves.toBe(51);
    await expect(convertCurrency(100.8, "EUR")).resolves.toBe(50);
    await expect(convertCurrency(101, "EUR")).resolves.toBe(50);
    await expect(convertCurrency(103, "EUR")).resolves.toBe(52);
    await expect(convertCurrency(100, "GBP")).rejects.toThrow(
      "Missing exchange rate for GBP",
    );
  });

  it("applyDurationDiscount chooses best discount or base rate", async () => {
    jest.resetModules();
    const { applyDurationDiscount } = await import("../src/pricing");
    const discounts = [
      { minDays: 10, rate: 0.3 },
      { minDays: 5, rate: 0.5 },
    ];
    expect(applyDurationDiscount(100, 12, discounts)).toBe(30);
    expect(applyDurationDiscount(100, 7, discounts)).toBe(50);
    expect(applyDurationDiscount(100, 3, discounts)).toBe(100);
  });

  it("computeDamageFee covers rule types and coverage waivers", async () => {
    const { computeDamageFee, readFile } = await setup({
      baseDailyRate: 0,
      durationDiscounts: [],
      damageFees: { lost: "deposit", scratch: 20, scuff: 20 },
      coverage: { scuff: { fee: 5, waiver: 10 } },
    });

    await expect(computeDamageFee(undefined, 50)).resolves.toBe(0);
    await expect(computeDamageFee(30, 50)).resolves.toBe(30);
    await expect(computeDamageFee("lost", 50)).resolves.toBe(50);
    await expect(computeDamageFee("scratch", 50)).resolves.toBe(20);
    await expect(computeDamageFee("scuff", 50)).resolves.toBe(20);
    await expect(computeDamageFee("scuff", 50, ["scuff"])).resolves.toBe(10);

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain("pricing.json");
  });

  it("priceForDays prefers dailyRate then price then base rate", async () => {
    const { priceForDays, readFile } = await setup({
      baseDailyRate: 5,
      durationDiscounts: [],
      damageFees: {},
    });

    await expect(
      priceForDays({ dailyRate: 8, price: 7 } as any, 3),
    ).resolves.toBe(24);
    await expect(priceForDays({ price: 7 } as any, 3)).resolves.toBe(21);
    await expect(priceForDays({} as any, 3)).resolves.toBe(15);

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain("pricing.json");
  });

  it("applies coverage waiver when coverage is included", async () => {
    const { computeDamageFee } = await setup({
      baseDailyRate: 0,
      durationDiscounts: [],
      damageFees: { scuff: 20 },
      coverage: { scuff: { fee: 5, waiver: 10 } },
    });

    await expect(computeDamageFee("scuff", 0, [], true)).resolves.toBe(10);
  });

  it("applies coverage waiver to deposit-based fees", async () => {
    const { computeDamageFee } = await setup({
      baseDailyRate: 0,
      durationDiscounts: [],
      damageFees: { lost: "deposit" },
      coverage: { lost: { fee: 5, waiver: 10 } },
    });

    await expect(computeDamageFee("lost", 50, ["lost"])).resolves.toBe(40);
  });
});
