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
      }),
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
});

