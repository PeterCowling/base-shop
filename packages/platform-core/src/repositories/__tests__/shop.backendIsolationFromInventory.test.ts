const resolveRepoMock = jest.fn();
jest.mock("../repoResolver", () => ({
  resolveRepo: resolveRepoMock,
}));

import { resolveRepo } from "../repoResolver";

describe("shop backend unaffected by INVENTORY_BACKEND", () => {
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origShopBackend = process.env.SHOP_BACKEND;
  const origDbUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
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

  it("uses Prisma shop backend when INVENTORY_BACKEND has non-json value", async () => {
    process.env.INVENTORY_BACKEND = "other";
    delete process.env.SHOP_BACKEND;

    const prismaRepo = {
      getShopById: jest.fn(),
      updateShopInRepo: jest.fn(),
    };
    const jsonRepo = {
      getShopById: jest.fn(),
      updateShopInRepo: jest.fn(),
    };

    (resolveRepo as jest.Mock).mockImplementation(
      async (
        _delegate: any,
        _prismaModule: any,
        _jsonModule: any,
        options: any = {},
      ) => {
        const backend = process.env[options.backendEnvVar ?? "INVENTORY_BACKEND"];
        return backend === "json" ? jsonRepo : prismaRepo;
      },
    );

    const { getShopById: getShopByIdFresh } = await import("../shop.server");
    await getShopByIdFresh("shop1");

    expect(prismaRepo.getShopById).toHaveBeenCalledWith("shop1");
    expect(jsonRepo.getShopById).not.toHaveBeenCalled();
  });

  it("uses JSON shop backend when SHOP_BACKEND=json even if INVENTORY_BACKEND has other value", async () => {
    process.env.INVENTORY_BACKEND = "other";
    process.env.SHOP_BACKEND = "json";

    const prismaRepo = {
      getShopById: jest.fn(),
      updateShopInRepo: jest.fn(),
    };
    const jsonRepo = {
      getShopById: jest.fn(),
      updateShopInRepo: jest.fn(),
    };

    (resolveRepo as jest.Mock).mockImplementation(
      async (
        _delegate: any,
        _prismaModule: any,
        _jsonModule: any,
        options: any = {},
      ) => {
        const backend = process.env[options.backendEnvVar ?? "INVENTORY_BACKEND"];
        return backend === "json" ? jsonRepo : prismaRepo;
      },
    );

    const { getShopById: getShopByIdFresh } = await import("../shop.server");
    await getShopByIdFresh("shop1");

    expect(jsonRepo.getShopById).toHaveBeenCalledWith("shop1");
    expect(prismaRepo.getShopById).not.toHaveBeenCalled();
  });
});

