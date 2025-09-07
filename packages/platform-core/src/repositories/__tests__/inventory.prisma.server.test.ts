import { promises as fs } from "node:fs";
import * as path from "node:path";
import os from "node:os";

describe("prisma inventory repository", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-prisma-test-"));
    process.env.DATA_ROOT = tmpDir;
    process.env.SKIP_STOCK_ALERT = "1";
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.DATA_ROOT;
    delete process.env.SKIP_STOCK_ALERT;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("persists to prisma and mirrors JSON", async () => {
    jest.resetModules();
    const store: any[] = [];
    const prisma = {
      inventoryItem: {
        findMany: jest.fn(async ({ where }: any) =>
          store.filter((r) => r.shopId === where.shopId),
        ),
        deleteMany: jest.fn(async ({ where }: any) => {
          for (let i = store.length - 1; i >= 0; i--) {
            if (store[i].shopId === where.shopId) store.splice(i, 1);
          }
        }),
        createMany: jest.fn(async ({ data }: any) => {
          store.push(...data);
          return { count: data.length };
        }),
      },
      $transaction: jest.fn(async (ops: any[]) => {
        for (const op of ops) await op;
      }),
    } as any;
    jest.doMock("../../db", () => ({ prisma }));
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");

    const shop = "demo";
    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    await prismaInventoryRepository.write(shop, items);

    expect(
      await prisma.inventoryItem.findMany({ where: { shopId: shop } }),
    ).toEqual([
      {
        shopId: shop,
        sku: "a",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
        lowStockThreshold: null,
        wearCount: null,
        wearAndTearLimit: null,
        maintenanceCycle: null,
        variantKey: "a",
      },
    ]);

    const file = await fs.readFile(
      path.join(tmpDir, shop, "inventory.json"),
      "utf8",
    );
    expect(JSON.parse(file)).toEqual(
      items.map(({ variantAttributes, ...rest }) => ({ ...rest })),
    );
  });

  it("falls back to JSON when Prisma fails", async () => {
    jest.resetModules();
    const { jsonInventoryRepository } = await import("../inventory.json.server");
    const shop = "demo";
    const initial = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    await jsonInventoryRepository.write(shop, initial);

    const prisma = {
      inventoryItem: {
        findMany: jest.fn().mockRejectedValue(new Error("fail")),
      },
      $transaction: jest.fn().mockRejectedValue(new Error("fail")),
    } as any;
    jest.doMock("../../db", () => ({ prisma }));
    const { prismaInventoryRepository } = await import("../inventory.prisma.server");

    expect(await prismaInventoryRepository.read(shop)).toEqual(initial);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalled();

    const next = [
      { sku: "b", productId: "p2", quantity: 2, variantAttributes: {} },
    ];
    await prismaInventoryRepository.write(shop, next);

    const file = await fs.readFile(
      path.join(tmpDir, shop, "inventory.json"),
      "utf8",
    );
    expect(JSON.parse(file)).toEqual(
      next.map(({ variantAttributes, ...rest }) => ({ ...rest })),
    );
  });
});

