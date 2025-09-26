import { jest } from "@jest/globals";

let inventoryPrismaImportCount = 0;
let inventoryJsonImportCount = 0;

const mockInventoryPrisma = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

const mockInventoryJson = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
};

jest.mock("../inventory.prisma.server", () => {
  inventoryPrismaImportCount++;
  return { prismaInventoryRepository: mockInventoryPrisma };
});

jest.mock("../inventory.json.server", () => {
  inventoryJsonImportCount++;
  return { jsonInventoryRepository: mockInventoryJson };
});

jest.mock("../../db", () => ({ prisma: { inventoryItem: {} } }));

jest.mock("../repoResolver", () => ({
  resolveRepo: async (
    _delegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const envVarName = options?.backendEnvVar ?? "INVENTORY_BACKEND";
    const backend = process.env[envVarName];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

describe("inventory backend unaffected by SHOP_BACKEND", () => {
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origShopBackend = process.env.SHOP_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    inventoryPrismaImportCount = 0;
    inventoryJsonImportCount = 0;
    process.env.DATABASE_URL = "postgres://test";
  });

  afterEach(() => {
    if (origInventoryBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = origInventoryBackend;
    }
    if (origShopBackend === undefined) {
      delete process.env.SHOP_BACKEND;
    } else {
      process.env.SHOP_BACKEND = origShopBackend;
    }
    if (origDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = origDbUrl;
    }
  });

  it("uses Prisma inventory backend when only SHOP_BACKEND is set", async () => {
    process.env.SHOP_BACKEND = "prisma";

    const { inventoryRepository } = await import("../inventory.server");
    await inventoryRepository.read("shop1");

    expect(inventoryPrismaImportCount).toBe(1);
    expect(inventoryJsonImportCount).toBe(0);
  });
});

