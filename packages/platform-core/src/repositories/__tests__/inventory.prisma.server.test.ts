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
  });

  afterEach(async () => {
    await fs.rm(dataRoot, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    delete process.env.SKIP_STOCK_ALERT;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("persists data to prisma and mirrors JSON file", async () => {
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

    const file = await fs.readFile(
      path.join(dataRoot, "shop", "inventory.json"),
      "utf8",
    );
    expect(JSON.parse(file)).toEqual([
      { sku: "a", productId: "p1", quantity: 1 },
      {
        sku: "b",
        productId: "p2",
        quantity: 2,
        variantAttributes: { color: "red" },
        lowStockThreshold: 1,
      },
    ]);
  });

  it("falls back to JSON when prisma fails", async () => {
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");
    const { jsonInventoryRepository } = await import("../inventory.json.server");
    const { prisma } = await import("../../db");

    const seed = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    await jsonInventoryRepository.write("shop", seed);

    const origFindMany = prisma.inventoryItem.findMany;
    jest
      .spyOn(prisma.inventoryItem, "findMany")
      .mockRejectedValueOnce(new Error("fail"));

    const readItems = await prismaInventoryRepository.read("shop");
    expect(readItems).toEqual(seed);

    (prisma.inventoryItem.findMany as any).mockImplementation(origFindMany);

    const updated = [
      { sku: "b", productId: "p2", quantity: 3, variantAttributes: {} },
    ];
    const origTx = prisma.$transaction;
    jest.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("fail"));

    await prismaInventoryRepository.write("shop", updated);

    (prisma.$transaction as any).mockImplementation(origTx);

    const dbItems = await prisma.inventoryItem.findMany({ where: { shopId: "shop" } });
    expect(dbItems).toEqual([]);

    const file = await fs.readFile(
      path.join(dataRoot, "shop", "inventory.json"),
      "utf8",
    );
    expect(JSON.parse(file)).toEqual([
      { sku: "b", productId: "p2", quantity: 3 },
    ]);
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

  it("falls back to JSON update when transaction throws", async () => {
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");
    const { jsonInventoryRepository } = await import("../inventory.json.server");
    const { prisma } = await import("../../db");

    jest
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(new Error("fail"));

    const mutate = () => ({
      productId: "p1",
      quantity: 2,
      variantAttributes: {},
    });
    const spy = jest.spyOn(jsonInventoryRepository, "update");

    await prismaInventoryRepository.update("shop", "a", {}, mutate);
    expect(spy).toHaveBeenCalledWith("shop", "a", {}, mutate);
  });

  it("reads from JSON when prisma model missing", async () => {
    const { prisma } = await import("../../db");
    const { jsonInventoryRepository } = await import("../inventory.json.server");
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");

    // simulate prisma not having inventoryItem model
    (prisma as any).inventoryItem = undefined;
    const spy = jest.spyOn(jsonInventoryRepository, "read");
    await prismaInventoryRepository.read("shop");
    expect(spy).toHaveBeenCalledWith("shop");
  });
});

