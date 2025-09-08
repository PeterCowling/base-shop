import { jest } from "@jest/globals";

let prismaImportCount = 0;
let jsonImportCount = 0;

const mockPrisma = {
  applyThemeData: jest.fn(),
  readShop: jest.fn(),
  writeShop: jest.fn(),
};

const mockJson = {
  applyThemeData: jest.fn(),
  readShop: jest.fn(),
  writeShop: jest.fn(),
};

jest.mock("../shops.prisma.server", () => {
  prismaImportCount++;
  return mockPrisma;
});

jest.mock("../shops.json.server", () => {
  jsonImportCount++;
  return mockJson;
});

jest.mock("../../db", () => ({ prisma: { shop: {} } }));

const resolveRepoMock = jest.fn(
  async (_delegate: any, prismaModule: any, jsonModule: any) => {
    if (process.env.INVENTORY_BACKEND === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
);

jest.mock("../repoResolver", () => ({ resolveRepo: resolveRepoMock }));

describe("shops repository backend selection", () => {
  const origBackend = process.env.INVENTORY_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    prismaImportCount = 0;
    jsonImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it("uses Prisma backend by default", async () => {
    delete process.env.INVENTORY_BACKEND;
    const repo = await import("../shops.server");

    await repo.readShop("shop1");

    expect(prismaImportCount).toBe(1);
    expect(jsonImportCount).toBe(0);
    expect(mockPrisma.readShop).toHaveBeenCalled();
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("uses JSON backend when INVENTORY_BACKEND=json", async () => {
    process.env.INVENTORY_BACKEND = "json";
    const repo = await import("../shops.server");

    await repo.readShop("shop1");

    expect(jsonImportCount).toBe(1);
    expect(prismaImportCount).toBe(0);
    expect(mockJson.readShop).toHaveBeenCalled();
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });
});

