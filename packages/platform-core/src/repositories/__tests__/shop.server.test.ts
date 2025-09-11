const resolveRepoMock = jest.fn();
jest.mock("../repoResolver", () => ({
  resolveRepo: resolveRepoMock,
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

  const originalBackend = process.env.SHOP_BACKEND;
  const originalInventoryBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    resolveRepoMock.mockReset();
    (resolveRepo as jest.Mock).mockResolvedValue(repo);
    repo.getShopById.mockReset();
    repo.updateShopInRepo.mockReset();
    if (originalBackend === undefined) {
      delete process.env.SHOP_BACKEND;
    } else {
      process.env.SHOP_BACKEND = originalBackend;
    }
    if (originalInventoryBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = originalInventoryBackend;
    }
  });

  afterEach(() => {
    if (originalBackend === undefined) {
      delete process.env.SHOP_BACKEND;
    } else {
      process.env.SHOP_BACKEND = originalBackend;
    }
    if (originalInventoryBackend === undefined) {
      delete process.env.INVENTORY_BACKEND;
    } else {
      process.env.INVENTORY_BACKEND = originalInventoryBackend;
    }
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

  it("uses SHOP_BACKEND for shops without affecting inventory", async () => {
    process.env.SHOP_BACKEND = "json";
    jest.resetModules();

    const shopRepo = {
      getShopById: jest.fn().mockResolvedValue({ id: "shop1" }),
      updateShopInRepo: jest.fn(),
    };

    const inventoryRepo = {
      read: jest.fn().mockResolvedValue([]),
      write: jest.fn(),
      update: jest.fn(),
    };

    const { resolveRepo: resolveRepoMock } = await import("../repoResolver");
    (resolveRepoMock as jest.Mock).mockImplementation(
      async (
        _prismaDelegate: any,
        _prismaModule: any,
        _jsonModule: any,
        options: any = {},
      ) => {
        const backend = process.env[options.backendEnvVar ?? "INVENTORY_BACKEND"];
        return backend === "json" ? shopRepo : inventoryRepo;
      },
    );

    const { getShopById: getShopByIdFresh } = await import("../shop.server");
    const { inventoryRepository } = await import("../inventory.server");

    await getShopByIdFresh("shop1");
    await inventoryRepository.read("shop1");

    expect(shopRepo.getShopById).toHaveBeenCalledWith("shop1");
    expect(inventoryRepo.read).toHaveBeenCalledWith("shop1");
    expect((resolveRepoMock as jest.Mock)).toHaveBeenCalledTimes(2);
    expect((resolveRepoMock as jest.Mock).mock.calls[0][3]).toEqual({
      backendEnvVar: "SHOP_BACKEND",
    });
    expect((resolveRepoMock as jest.Mock).mock.calls[1][3]).toMatchObject({
      backendEnvVar: "INVENTORY_BACKEND",
    });
  });

  it("uses Prisma shop backend when only INVENTORY_BACKEND is set", async () => {
    delete process.env.SHOP_BACKEND;
    process.env.INVENTORY_BACKEND = "json";
    jest.resetModules();

    const shopRepo = {
      getShopById: jest.fn().mockResolvedValue({ id: "shop1" }),
      updateShopInRepo: jest.fn(),
    };

    const inventoryRepo = {
      read: jest.fn().mockResolvedValue([]),
      write: jest.fn(),
      update: jest.fn(),
    };

    const { resolveRepo: resolveRepoMock } = await import("../repoResolver");
    (resolveRepoMock as jest.Mock).mockImplementation(
      async (
        _prismaDelegate: any,
        _prismaModule: any,
        _jsonModule: any,
        options: any = {},
      ) => {
        const backend = process.env[options.backendEnvVar ?? "INVENTORY_BACKEND"];
        return backend === "json" ? inventoryRepo : shopRepo;
      },
    );

    const { getShopById: getShopByIdFresh } = await import("../shop.server");
    const { inventoryRepository } = await import("../inventory.server");

    await getShopByIdFresh("shop1");
    await inventoryRepository.read("shop1");

    expect(shopRepo.getShopById).toHaveBeenCalledWith("shop1");
    expect(inventoryRepo.read).toHaveBeenCalledWith("shop1");
    expect((resolveRepoMock as jest.Mock)).toHaveBeenCalledTimes(2);
    expect((resolveRepoMock as jest.Mock).mock.calls[0][3]).toEqual({
      backendEnvVar: "SHOP_BACKEND",
    });
    expect((resolveRepoMock as jest.Mock).mock.calls[1][3]).toMatchObject({
      backendEnvVar: "INVENTORY_BACKEND",
    });
  });
});

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
    const { resolveRepo: resolveRepoMock } = await import("../repoResolver");
    (resolveRepoMock as jest.Mock).mockImplementation(
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

