import { getShopById, updateShopInRepo } from "../shop.server";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __shopServerDelegationResolveRepoMock: jest.Mock | undefined;
}
globalThis.__shopServerDelegationResolveRepoMock = jest.fn();

jest.mock("../repoResolver", () => ({
  get resolveRepo() {
    return globalThis.__shopServerDelegationResolveRepoMock;
  },
}));

const { resolveRepo } = require("../repoResolver") as { resolveRepo: jest.Mock };

describe("shop.server delegation", () => {
  const repo = {
    getShopById: jest.fn(),
    updateShopInRepo: jest.fn(),
  } as const;

  const originalBackend = process.env.SHOP_BACKEND;
  const originalInventoryBackend = process.env.INVENTORY_BACKEND;

  beforeEach(() => {
    globalThis.__shopServerDelegationResolveRepoMock.mockReset();
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

  it("propagates errors from getShopById", async () => {
    const error = new Error("get failed");
    repo.getShopById.mockRejectedValue(error);
    await expect(getShopById("shop1")).rejects.toThrow(error);
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.getShopById).toHaveBeenCalledWith("shop1");
  });

  it("propagates errors from updateShopInRepo", async () => {
    const error = new Error("update failed");
    const patch = { id: "shop1", name: "Updated" };
    repo.updateShopInRepo.mockRejectedValue(error);
    await expect(updateShopInRepo("shop1", patch)).rejects.toThrow(error);
    expect(resolveRepo).toHaveBeenCalled();
    expect(repo.updateShopInRepo).toHaveBeenCalledWith("shop1", patch);
  });

  it("clears repoPromise in test env and forwards params", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    const repo1 = {
      getShopById: jest.fn().mockResolvedValue({ id: "shop1" }),
      updateShopInRepo: jest.fn(),
    };

    const repo2 = {
      getShopById: jest.fn(),
      updateShopInRepo: jest
        .fn()
        .mockResolvedValue({ id: "shop1", name: "Updated" }),
    };

    (resolveRepo as jest.Mock).mockReset();
    (resolveRepo as jest.Mock)
      .mockResolvedValueOnce(repo1)
      .mockResolvedValueOnce(repo2);

    const patch = { id: "shop1", name: "Updated" };
    const shop = await getShopById("shop1");
    const updated = await updateShopInRepo("shop1", patch);

    expect(resolveRepo).toHaveBeenCalledTimes(2);
    expect(repo1.getShopById).toHaveBeenCalledWith("shop1");
    expect(repo2.updateShopInRepo).toHaveBeenCalledWith("shop1", patch);
    expect(shop).toEqual({ id: "shop1" });
    expect(updated).toEqual({ id: "shop1", name: "Updated" });

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

