/** @jest-environment node */

describe("shop.server prisma repository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SHOP_BACKEND;
    delete process.env.DATABASE_URL;
  });

  it("delegates getShopById to prisma repository", async () => {
    process.env.SHOP_BACKEND = "prisma";
    process.env.DATABASE_URL = "postgres://example";
    const getShopById = jest.fn().mockResolvedValue({ id: "shop" });
    const updateShopInRepo = jest.fn();
    jest.doMock("../src/db", () => ({ prisma: { shop: {} } }));
    jest.doMock("../src/repositories/shop.prisma.server", () => ({
      getShopById,
      updateShopInRepo,
    }));
    const { getShopById: subject } = await import(
      "../src/repositories/shop.server"
    );
    await expect(subject("shop")).resolves.toEqual({ id: "shop" });
    expect(getShopById).toHaveBeenCalledWith("shop");
  });

  it("delegates updateShopInRepo to prisma repository", async () => {
    process.env.SHOP_BACKEND = "prisma";
    process.env.DATABASE_URL = "postgres://example";
    const getShopById = jest.fn();
    const updateShopInRepo = jest
      .fn()
      .mockResolvedValue({ id: "shop", name: "new" });
    jest.doMock("../src/db", () => ({ prisma: { shop: {} } }));
    jest.doMock("../src/repositories/shop.prisma.server", () => ({
      getShopById,
      updateShopInRepo,
    }));
    const { updateShopInRepo: subject } = await import(
      "../src/repositories/shop.server"
    );
    const patch = { id: "shop", name: "new" };
    await expect(subject("shop", patch)).resolves.toEqual({
      id: "shop",
      name: "new",
    });
    expect(updateShopInRepo).toHaveBeenCalledWith("shop", patch);
  });
});
