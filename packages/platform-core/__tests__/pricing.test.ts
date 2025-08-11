import { jest } from '@jest/globals';

const defaultPricing = {
  baseDailyRate: 10,
  durationDiscounts: [],
  damageFees: { lost: 'deposit', scratch: 20 },
};

const defaultRates = {
  base: 'USD',
  rates: { EUR: 0.5 },
};

async function setup(
  pricingData: any = defaultPricing,
  rateData: any = defaultRates
) {
  jest.resetModules();
  const readFile = jest.fn(async (file: string) => {
    if (file.includes('pricing.json')) return JSON.stringify(pricingData);
    if (file.includes('exchangeRates.json')) return JSON.stringify(rateData);
    throw new Error(`Unexpected file: ${file}`);
  });
  const actualFs = jest.requireActual('node:fs');
  jest.doMock('node:fs', () => ({
    ...actualFs,
    promises: { ...actualFs.promises, readFile },
  }));
  const mod = await import('../src/pricing');
  return { ...mod, readFile };
}

describe('pricing utilities', () => {
  it('convertCurrency with existing/missing rates and same currency', async () => {
    const { convertCurrency, readFile } = await setup(undefined, {
      base: 'USD',
      rates: { EUR: 0.5 },
    });

    await expect(convertCurrency(100, 'USD')).resolves.toBe(100);
    await expect(convertCurrency(100, 'EUR')).resolves.toBe(50);
    await expect(convertCurrency(100, 'GBP')).rejects.toThrow(
      'Missing exchange rate for GBP'
    );

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain('exchangeRates.json');
  });

  it('applyDurationDiscount ordering logic', async () => {
    jest.resetModules();
    const { applyDurationDiscount } = await import('../src/pricing');
    const discounts = [
      { minDays: 5, rate: 0.5 },
      { minDays: 10, rate: 0.3 },
    ];
    expect(applyDurationDiscount(100, 10, discounts)).toBe(30);
    expect(applyDurationDiscount(100, 7, discounts)).toBe(50);
    expect(applyDurationDiscount(100, 3, discounts)).toBe(100);
  });

  it('priceForDays fallback to SKU price and base rate', async () => {
    const { priceForDays, readFile } = await setup({
      baseDailyRate: 5,
      durationDiscounts: [],
      damageFees: {},
    });

    await expect(priceForDays({ price: 7 } as any, 3)).resolves.toBe(21);
    await expect(priceForDays({} as any, 3)).resolves.toBe(15);

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain('pricing.json');
  });

  it('computeDamageFee for numeric, deposit, unknown kinds, and undefined', async () => {
    const { computeDamageFee, readFile } = await setup({
      baseDailyRate: 0,
      durationDiscounts: [],
      damageFees: { lost: 'deposit', scratch: 20 },
    });

    await expect(computeDamageFee(30, 50)).resolves.toBe(30);
    await expect(computeDamageFee('lost', 50)).resolves.toBe(50);
    await expect(computeDamageFee('unknown', 50)).resolves.toBe(0);
    await expect(computeDamageFee(undefined, 50)).resolves.toBe(0);

    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile.mock.calls[0][0]).toContain('pricing.json');
  });
});

