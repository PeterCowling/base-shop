jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../repoResolver";
import { getShopById, updateShopInRepo } from "../shop.server";

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

jest.mock("../../db", () => ({ prisma: { shop: {}, inventoryItem: {} } }));

describe("shop.server wrapper", () => {
  const repo = {
    getShopById: jest.fn(),
    updateShopInRepo: jest.fn(),
  } as const;

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue(repo);
    repo.getShopById.mockReset();
    repo.updateShopInRepo.mockReset();
  });

  it("delegates getShopById to the resolved repository", async () => {
    repo.getShopById.mockResolvedValue({ id: "shop1" });
    const result = await getShopById("shop1");
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.getShopById).toHaveBeenCalledWith("shop1");
    expect(result).toEqual({ id: "shop1" });
  });

  it("delegates updateShopInRepo to the resolved repository", async () => {
    repo.updateShopInRepo.mockResolvedValue({ id: "shop1", name: "Updated" });
    const patch = { id: "shop1", name: "Updated" };
    const result = await updateShopInRepo("shop1", patch);
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.updateShopInRepo).toHaveBeenCalledWith("shop1", patch);
    expect(result).toEqual({ id: "shop1", name: "Updated" });
  });
});

describe("inventory backend unaffected by SHOP_BACKEND", () => {
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origShopBackend = process.env.SHOP_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
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
    process.env.SHOP_BACKEND = "json";
    (resolveRepo as jest.Mock).mockImplementation(
      async (
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
    );

    const { inventoryRepository } = await import("../inventory.server");
    await inventoryRepository.read("shop1");

    expect(inventoryPrismaImportCount).toBe(1);
    expect(inventoryJsonImportCount).toBe(0);
  });
});

