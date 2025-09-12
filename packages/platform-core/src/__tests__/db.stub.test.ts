/** @jest-environment node */

import { createTestPrismaStub } from "../db";

describe("createTestPrismaStub inventoryItem", () => {
  it("throws when deleting a nonexistent inventory item", async () => {
    const prisma = createTestPrismaStub();

    await expect(
      prisma.inventoryItem.delete({
        where: {
          shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
        },
      })
    ).rejects.toThrow("InventoryItem not found");
  });

  it("upserts a record when inventory item is missing", async () => {
    const prisma = createTestPrismaStub();
    const where = {
      shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
    };

    expect(await prisma.inventoryItem.findUnique({ where })).toBeNull();

    const create = { shopId: "s", sku: "sku", variantKey: "v", quantity: 1 };
    const result = await prisma.inventoryItem.upsert({
      where,
      update: { quantity: 2 },
      create,
    });

    expect(result).toMatchObject(create);
  });

  it("creates and finds many inventory items for a shop", async () => {
    const prisma = createTestPrismaStub();

    await prisma.inventoryItem.createMany({
      data: [
        { shopId: "shop1", sku: "sku1", variantKey: "v1", quantity: 1 },
        { shopId: "shop1", sku: "sku2", variantKey: "v2", quantity: 2 },
        { shopId: "shop2", sku: "sku3", variantKey: "v1", quantity: 3 },
      ],
    });

    const items = await prisma.inventoryItem.findMany({
      where: { shopId: "shop1" },
    });

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.sku)).toEqual(["sku1", "sku2"]);
  });

  it("finds unique inventory items when present and returns null otherwise", async () => {
    const prisma = createTestPrismaStub();
    const where = {
      shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
    };

    expect(await prisma.inventoryItem.findUnique({ where })).toBeNull();

    await prisma.inventoryItem.createMany({
      data: [{ shopId: "s", sku: "sku", variantKey: "v", quantity: 1 }],
    });

    const found = await prisma.inventoryItem.findUnique({ where });
    expect(found?.quantity).toBe(1);
  });

  it("deletes inventory items individually and in bulk", async () => {
    const prisma = createTestPrismaStub();

    await prisma.inventoryItem.createMany({
      data: [
        { shopId: "s", sku: "sku1", variantKey: "v", quantity: 1 },
        { shopId: "s", sku: "sku2", variantKey: "v", quantity: 1 },
      ],
    });

    await prisma.inventoryItem.delete({
      where: {
        shopId_sku_variantKey: { shopId: "s", sku: "sku1", variantKey: "v" },
      },
    });

    let items = await prisma.inventoryItem.findMany({ where: { shopId: "s" } });
    expect(items).toHaveLength(1);

    await prisma.inventoryItem.deleteMany({ where: { shopId: "s" } });
    items = await prisma.inventoryItem.findMany({ where: { shopId: "s" } });
    expect(items).toHaveLength(0);
  });

  it("upserts an existing inventory item", async () => {
    const prisma = createTestPrismaStub();
    const where = {
      shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
    };

    await prisma.inventoryItem.createMany({
      data: [{ shopId: "s", sku: "sku", variantKey: "v", quantity: 1 }],
    });

    const result = await prisma.inventoryItem.upsert({
      where,
      update: { quantity: 5 },
      create: { shopId: "s", sku: "sku", variantKey: "v", quantity: 1 },
    });

    expect(result.quantity).toBe(5);

    const found = await prisma.inventoryItem.findUnique({ where });
    expect(found?.quantity).toBe(5);
  });
});
