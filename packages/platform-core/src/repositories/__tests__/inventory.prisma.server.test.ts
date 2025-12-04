import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

jest.mock("../../services/stockAlert.server", () => ({
  checkAndAlert: jest.fn(),
}));

describe("prisma inventory repository", () => {
  let dataRoot: string;

  beforeEach(async () => {
    dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "inventory-"));
    process.env.DATA_ROOT = dataRoot;
    process.env.SKIP_STOCK_ALERT = "1";
    jest.resetModules();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(dataRoot, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    delete process.env.SKIP_STOCK_ALERT;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("persists data to prisma without mirroring JSON by default", async () => {
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");
    const { prisma } = await import("../../db");

    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
      {
        sku: "b",
        productId: "p2",
        quantity: 2,
        variantAttributes: { color: "red" },
        lowStockThreshold: 1,
      },
    ];

    await prismaInventoryRepository.write("shop", items);

    const dbItems = await prisma.inventoryItem.findMany({ where: { shopId: "shop" } });
    expect(dbItems).toMatchObject([
      {
        shopId: "shop",
        sku: "a",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
        lowStockThreshold: null,
      },
      {
        shopId: "shop",
        sku: "b",
        productId: "p2",
        quantity: 2,
        variantAttributes: { color: "red" },
        lowStockThreshold: 1,
      },
    ]);

    await expect(
      fs.readFile(path.join(dataRoot, "shop", "inventory.json"), "utf8"),
    ).rejects.toHaveProperty("code", "ENOENT");
  });

  it("alerts when low stock and alerts enabled", async () => {
    delete process.env.SKIP_STOCK_ALERT;
    const { checkAndAlert } = await import("../../services/stockAlert.server");
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");

    const items = [
      {
        sku: "a",
        productId: "p1",
        quantity: 0,
        variantAttributes: {},
        lowStockThreshold: 1,
      },
    ];

    await prismaInventoryRepository.write("shop", items);
    expect(checkAndAlert).toHaveBeenCalledWith("shop", items);
  });

  it("removes item when mutate returns undefined", async () => {
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");
    const { prisma } = await import("../../db");

    await prismaInventoryRepository.write("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);

    await prismaInventoryRepository.update(
      "shop",
      "a",
      {},
      () => undefined,
    );

    const dbItems = await prisma.inventoryItem.findMany({ where: { shopId: "shop" } });
    expect(dbItems).toEqual([]);
  });

  it("surfaces transaction failures to the caller", async () => {
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");
    const { prisma } = await import("../../db");

    jest.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("boom"));

    await expect(
      prismaInventoryRepository.update("shop", "a", {}, () => ({
        productId: "p1",
        quantity: 2,
        variantAttributes: {},
      })),
    ).rejects.toThrow("boom");
  });

  it("throws when prisma delegate is missing", async () => {
    const { prisma } = await import("../../db");
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");

    (prisma as any).inventoryItem = undefined;

    await expect(prismaInventoryRepository.read("shop")).rejects.toThrow(
      "Prisma inventory delegate is unavailable",
    );
  });
});
