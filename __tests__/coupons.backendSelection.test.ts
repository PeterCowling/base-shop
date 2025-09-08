import { jest } from "@jest/globals";

const mockJson = {
  read: jest.fn(),
  write: jest.fn(),
  getByCode: jest.fn(),
};

const mockPrisma = {
  read: jest.fn(),
  write: jest.fn(),
  getByCode: jest.fn(),
};

let prismaImportCount = 0;

jest.mock(
  "../packages/platform-core/src/repositories/coupons.json.server",
  () => ({ jsonCouponsRepository: mockJson }),
);

jest.mock(
  "../packages/platform-core/src/repositories/coupons.prisma.server",
  () => {
    prismaImportCount++;
    return { prismaCouponsRepository: mockPrisma };
  },
);

jest.mock("../packages/platform-core/src/db", () => ({
  prisma: { coupon: {} },
}));

jest.mock("../packages/platform-core/src/repositories/repoResolver", () => ({
  resolveRepo: async (
    prismaDelegate: any,
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

describe("coupons repository backend selection", () => {
  const origBackend = process.env.COUPONS_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.COUPONS_BACKEND;
    } else {
      process.env.COUPONS_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it('uses json repository when COUPONS_BACKEND="json"', async () => {
    process.env.COUPONS_BACKEND = "json";
    const repo = await import(
      "../packages/platform-core/src/repositories/coupons.server"
    );

    await repo.readCouponRepo("shop");
    await repo.writeCouponRepo("shop", []);
    await repo.getCouponByCode("shop", "code");

    expect(mockJson.read).toHaveBeenCalledWith("shop");
    expect(mockJson.write).toHaveBeenCalledWith("shop", []);
    expect(mockJson.getByCode).toHaveBeenCalledWith("shop", "code");
    expect(mockPrisma.read).not.toHaveBeenCalled();
  });

  it("defaults to the Prisma repository when COUPONS_BACKEND is not set", async () => {
    delete process.env.COUPONS_BACKEND;
    const repo = await import(
      "../packages/platform-core/src/repositories/coupons.server"
    );

    await repo.readCouponRepo("shop");
    await repo.writeCouponRepo("shop", []);
    await repo.getCouponByCode("shop", "code");

    expect(mockPrisma.read).toHaveBeenCalledWith("shop");
    expect(mockPrisma.write).toHaveBeenCalledWith("shop", []);
    expect(mockPrisma.getByCode).toHaveBeenCalledWith("shop", "code");
    expect(mockJson.read).not.toHaveBeenCalled();
    expect(prismaImportCount).toBe(1);
  });
});

