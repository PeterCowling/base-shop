import { jest } from "@jest/globals";

describe("products repository via prisma", () => {
  const shop = "demo";
  let repo: { write: jest.Mock; duplicate: jest.Mock };
  let resolveRepo: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    repo = { write: jest.fn(), duplicate: jest.fn() };
    resolveRepo = jest.fn().mockResolvedValue(repo);
    process.env.PRODUCTS_BACKEND = "prisma";
    process.env.DATABASE_URL = "postgres://example";
    jest.doMock("../../db", () => ({ prisma: { product: {} } }));
    jest.doMock("../products.prisma.server", () => ({
      prismaProductsRepository: repo,
    }));
    jest.doMock("../repoResolver", () => ({ resolveRepo }));
  });

  afterEach(() => {
    delete process.env.PRODUCTS_BACKEND;
    delete process.env.DATABASE_URL;
  });

  it("writeRepo forwards catalogue to repo.write", async () => {
    const { writeRepo } = await import("../products.server");
    const catalogue = [{ id: "1" } as any];
    await writeRepo(shop, catalogue);
    expect(repo.write).toHaveBeenCalledWith(shop, catalogue);
  });

  it("duplicateProductInRepo forwards shop and id to repo.duplicate", async () => {
    const { duplicateProductInRepo } = await import("../products.server");
    await duplicateProductInRepo(shop, "1");
    expect(repo.duplicate).toHaveBeenCalledWith(shop, "1");
  });

  it("caches repo across calls", async () => {
    const { writeRepo, duplicateProductInRepo } = await import(
      "../products.server",
    );
    const catalogue = [{ id: "1" } as any];
    await writeRepo(shop, catalogue);
    await duplicateProductInRepo(shop, "1");
    expect(resolveRepo).toHaveBeenCalledTimes(1);
    expect(repo.write).toHaveBeenCalledWith(shop, catalogue);
    expect(repo.duplicate).toHaveBeenCalledWith(shop, "1");
  });
});
