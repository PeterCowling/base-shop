import { jest } from '@jest/globals';

const mockJson = {
  read: jest.fn(),
  write: jest.fn(),
};

const mockPrisma = {
  read: jest.fn(),
  write: jest.fn(),
};

let prismaImportCount = 0;

jest.mock('../pricing.json.server', () => ({
  jsonPricingRepository: mockJson,
}));

jest.mock('../pricing.prisma.server', () => {
  prismaImportCount++;
  return { prismaPricingRepository: mockPrisma };
});

jest.mock('../../db', () => ({ prisma: { pricing: {} } }));

jest.mock('../repoResolver', () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === 'json') {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe('pricing repository backend selection', () => {
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = 'postgres://test';
  });

  afterEach(() => {
    delete process.env.PRICING_BACKEND;
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when PRICING_BACKEND="json"', async () => {
    process.env.PRICING_BACKEND = 'json';
    const { readPricing, writePricing } = await import('../pricing.server');

    await readPricing();
    await writePricing({} as any);

    expect(mockJson.read).toHaveBeenCalled();
    expect(mockJson.write).toHaveBeenCalled();
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it('defaults to the Prisma repository when PRICING_BACKEND is not set', async () => {
    delete process.env.PRICING_BACKEND;
    const { readPricing, writePricing } = await import('../pricing.server');

    await readPricing();
    await writePricing({} as any);

    expect(mockPrisma.read).toHaveBeenCalled();
    expect(mockPrisma.write).toHaveBeenCalled();
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});
