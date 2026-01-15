import { jest } from "@jest/globals";

async function loadApi() {
  const { prisma } = await import("../src/db");
  const { variantKey } = await import("../src/types/inventory");
  const holds = await import("../src/inventoryHolds");
  return { prisma: prisma as any, variantKey, ...holds };
}

describe("inventory holds", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("creates a hold and decrements inventory", async () => {
    jest.resetModules();
    const { prisma, variantKey, createInventoryHold } = await loadApi();
    await seedInventory({
      prisma,
      variantKey,
      shopId: "shop",
      sku: "sku_1",
      productId: "prod_1",
      variantAttributes: { size: "M" },
      quantity: 5,
    });

    const hold = await createInventoryHold({
      shopId: "shop",
      requests: [{ sku: "sku_1", quantity: 2, variantAttributes: { size: "M" } }],
    });

    expect(hold.holdId).toBeTruthy();
    await expect(readQty({ prisma, variantKey, shopId: "shop", sku: "sku_1", attrs: { size: "M" } })).resolves.toBe(3);
  });

  test("releases a hold and restores inventory", async () => {
    jest.resetModules();
    const { prisma, variantKey, createInventoryHold, releaseInventoryHold } = await loadApi();
    await seedInventory({
      prisma,
      variantKey,
      shopId: "shop",
      sku: "sku_1",
      productId: "prod_1",
      variantAttributes: { size: "M" },
      quantity: 5,
    });

    const hold = await createInventoryHold({
      shopId: "shop",
      requests: [{ sku: "sku_1", quantity: 2, variantAttributes: { size: "M" } }],
    });

    await releaseInventoryHold({ shopId: "shop", holdId: hold.holdId });
    await expect(readQty({ prisma, variantKey, shopId: "shop", sku: "sku_1", attrs: { size: "M" } })).resolves.toBe(5);
  });

  test("insufficient inventory throws with available quantities", async () => {
    jest.resetModules();
    const { prisma, variantKey, createInventoryHold, InventoryHoldInsufficientError } = await loadApi();
    await seedInventory({
      prisma,
      variantKey,
      shopId: "shop",
      sku: "sku_1",
      productId: "prod_1",
      variantAttributes: { size: "M" },
      quantity: 1,
    });

    await expect(
      createInventoryHold({
        shopId: "shop",
        requests: [{ sku: "sku_1", quantity: 2, variantAttributes: { size: "M" } }],
      }),
    ).rejects.toMatchObject({
      insufficient: [
        expect.objectContaining({
          sku: "sku_1",
          requested: 2,
          available: 1,
        }),
      ],
    } satisfies Partial<InventoryHoldInsufficientError>);
  });

  test("reaps expired holds on subsequent reservations", async () => {
    jest.resetModules();
    const { prisma, variantKey, createInventoryHold } = await loadApi();
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
    await seedInventory({
      prisma,
      variantKey,
      shopId: "shop",
      sku: "sku_1",
      productId: "prod_1",
      variantAttributes: { size: "M" },
      quantity: 5,
    });

    const hold1 = await createInventoryHold({
      shopId: "shop",
      ttlSeconds: 30,
      requests: [{ sku: "sku_1", quantity: 2, variantAttributes: { size: "M" } }],
    });
    expect(await readQty({ prisma, variantKey, shopId: "shop", sku: "sku_1", attrs: { size: "M" } })).toBe(3);

    jest.setSystemTime(new Date("2025-01-01T00:01:00Z"));
    await createInventoryHold({
      shopId: "shop",
      ttlSeconds: 30,
      requests: [{ sku: "sku_1", quantity: 1, variantAttributes: { size: "M" } }],
    });

    expect(await readQty({ prisma, variantKey, shopId: "shop", sku: "sku_1", attrs: { size: "M" } })).toBe(4);

    const holdRow = await (prisma as any).inventoryHold.findUnique({
      where: { id: hold1.holdId },
    });
    expect(holdRow?.status).toBe("expired");
  });

  test("committing a hold prevents release", async () => {
    jest.resetModules();
    const { prisma, variantKey, createInventoryHold, commitInventoryHold, releaseInventoryHold } = await loadApi();
    await seedInventory({
      prisma,
      variantKey,
      shopId: "shop",
      sku: "sku_1",
      productId: "prod_1",
      variantAttributes: { size: "M" },
      quantity: 5,
    });

    const hold = await createInventoryHold({
      shopId: "shop",
      requests: [{ sku: "sku_1", quantity: 2, variantAttributes: { size: "M" } }],
    });

    await commitInventoryHold({ shopId: "shop", holdId: hold.holdId });
    await releaseInventoryHold({ shopId: "shop", holdId: hold.holdId });
    await expect(readQty({ prisma, variantKey, shopId: "shop", sku: "sku_1", attrs: { size: "M" } })).resolves.toBe(3);
  });
});

function seedInventory(params: {
  prisma: any;
  variantKey: (sku: string, attrs: Record<string, string>) => string;
  shopId: string;
  sku: string;
  productId: string;
  variantAttributes: Record<string, string>;
  quantity: number;
}) {
  const key = params.variantKey(params.sku, params.variantAttributes);
  return params.prisma.inventoryItem.createMany({
    data: [
      {
        shopId: params.shopId,
        sku: params.sku,
        productId: params.productId,
        quantity: params.quantity,
        variantAttributes: params.variantAttributes,
        variantKey: key,
      },
    ],
  });
}

async function readQty(params: {
  prisma: any;
  variantKey: (sku: string, attrs: Record<string, string>) => string;
  shopId: string;
  sku: string;
  attrs: Record<string, string>;
}): Promise<number> {
  const key = params.variantKey(params.sku, params.attrs);
  const row = await params.prisma.inventoryItem.findUnique({
    where: { shopId_sku_variantKey: { shopId: params.shopId, sku: params.sku, variantKey: key } },
  });
  return typeof row?.quantity === "number" ? row.quantity : 0;
}
