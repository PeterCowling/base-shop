const resolveRepoMock = jest.fn();
jest.mock("../repoResolver", () => ({
  resolveRepo: resolveRepoMock,
}));

describe("shop backend selection", () => {
  const originalBackend = process.env.SHOP_BACKEND;
  const originalInventoryBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
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
