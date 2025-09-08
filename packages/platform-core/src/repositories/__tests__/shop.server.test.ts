jest.mock("../repoResolver", () => ({
  resolveRepo: jest.fn(),
}));

import { resolveRepo } from "../repoResolver";
import { getShopById, updateShopInRepo } from "../shop.server";

describe("shop.server wrapper", () => {
  const repo = {
    getShopById: jest.fn(),
    updateShopInRepo: jest.fn(),
  } as const;

  const originalBackend = process.env.SHOP_BACKEND;

  beforeEach(() => {
    (resolveRepo as jest.Mock).mockResolvedValue(repo);
    repo.getShopById.mockReset();
    repo.updateShopInRepo.mockReset();
    if (originalBackend === undefined) {
      delete process.env.SHOP_BACKEND;
    } else {
      process.env.SHOP_BACKEND = originalBackend;
    }
  });

  afterEach(() => {
    if (originalBackend === undefined) {
      delete process.env.SHOP_BACKEND;
    } else {
      process.env.SHOP_BACKEND = originalBackend;
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
});

