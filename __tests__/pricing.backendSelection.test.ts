import { jest } from "@jest/globals";

const mockJson = {
  read: jest.fn(),
  write: jest.fn(),
};

const mockPrisma = {
  read: jest.fn(),
  write: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/pricing.json.server",
  () => ({ jsonPricingRepository: mockJson }),
);

jest.mock(
  "../packages/platform-core/src/repositories/pricing.prisma.server",
  () => {
    prismaImportCount++;
    return { prismaPricingRepository: mockPrisma };
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { pricing: {} },
}));

jest.mock("../packages/platform-core/src/repositories/repoResolver", () => ({
  resolveRepo: async (
    _prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe("pricing repository backend selection", () => {
  const origBackend = process.env.PRICING_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.PRICING_BACKEND;
    } else {
      process.env.PRICING_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when PRICING_BACKEND="json"', async () => {
    process.env.PRICING_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/pricing.server",
    );

    await repo.readPricing();
    await repo.writePricing({} as any);

    expect(mockJson.read).toHaveBeenCalled();
    expect(mockJson.write).toHaveBeenCalled();
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when PRICING_BACKEND is not set", async () => {
    delete process.env.PRICING_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/pricing.server",
    );

    await repo.readPricing();
    await repo.writePricing({} as any);

    expect(mockPrisma.read).toHaveBeenCalled();
    expect(mockPrisma.write).toHaveBeenCalled();
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});

