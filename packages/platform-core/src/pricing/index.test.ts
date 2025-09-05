/** @jest-environment node */

jest.mock('node:fs', () => ({ promises: { readFile: jest.fn() } }));
jest.mock('../dataRoot', () => ({ resolveDataRoot: () => '/data' }));

const readFileMock = () =>
  (jest.requireMock('node:fs') as { promises: { readFile: jest.Mock } }).promises
    .readFile;

const pricingData = {
  baseDailyRate: 10,
  durationDiscounts: [
    { minDays: 3, rate: 0.9 },
    { minDays: 5, rate: 0.8 },
    { minDays: 10, rate: 0.5 },
  ],
  damageFees: { lost: 'deposit', scuff: 20 },
  coverage: {
    lost: { fee: 0, waiver: 30 },
    scuff: { fee: 0, waiver: 25 },
  },
};

const rateData = { base: 'USD', rates: { EUR: 1.27, GBP: 1.23 } };

async function loadModule() {
  const mod = await import('./index');
  return mod;
}

describe('pricing', () => {
  beforeEach(() => {
    jest.resetModules();
    readFileMock().mockReset();
  });

  it('getPricing caches result', async () => {
    readFileMock().mockResolvedValueOnce(JSON.stringify(pricingData));
    const { getPricing } = await loadModule();
    await getPricing();
    await getPricing();
    expect(readFileMock()).toHaveBeenCalledTimes(1);
  });

  it('convertCurrency rounds and errors on missing rate', async () => {
    readFileMock().mockImplementation(async (file: string) => {
      if (file.includes('exchangeRates.json')) return JSON.stringify(rateData);
      return JSON.stringify(pricingData);
    });
    const { convertCurrency } = await loadModule();
    await expect(convertCurrency(10, 'EUR')).resolves.toBe(13);
    await expect(convertCurrency(10, 'GBP')).resolves.toBe(12);
    await expect(convertCurrency(10, 'JPY')).rejects.toThrow('Missing exchange rate for JPY');
  });

  it('applyDurationDiscount chooses largest applicable discount', async () => {
    const { applyDurationDiscount } = await loadModule();
    const rate = applyDurationDiscount(100, 6, pricingData.durationDiscounts);
    expect(rate).toBe(80);
  });

  it('computeDamageFee respects coverage and rules', async () => {
    readFileMock().mockImplementation(async (file: string) => {
      if (file.includes('pricing.json')) return JSON.stringify(pricingData);
      return JSON.stringify({ base: 'USD', rates: {} });
    });
    const { computeDamageFee } = await loadModule();
    await expect(computeDamageFee(undefined, 50)).resolves.toBe(0);
    await expect(computeDamageFee('lost', 50)).resolves.toBe(50);
    await expect(computeDamageFee('scuff', 0)).resolves.toBe(20);
    await expect(computeDamageFee('scuff', 0, ['scuff'])).resolves.toBe(0);
    await expect(computeDamageFee('lost', 50, [], true)).resolves.toBe(20);
  });
});

