/** @jest-environment node */

import { createInventoryItemDelegate } from "../src/db/stubs";

describe("createInventoryItemDelegate", () => {
  it("deleteMany removes records and findMany returns only the requested shop", async () => {
    const inventory = createInventoryItemDelegate();
    await inventory.createMany({
      data: [
        { shopId: "s1", sku: "a", variantKey: "v1", quantity: 1 },
        { shopId: "s1", sku: "b", variantKey: "v1", quantity: 2 },
        { shopId: "s2", sku: "c", variantKey: "v1", quantity: 3 },
      ],
    });

    await expect(
      inventory.findMany({ where: { shopId: "s1" } })
    ).resolves.toHaveLength(2);
    await expect(
      inventory.findMany({ where: { shopId: "s2" } })
    ).resolves.toHaveLength(1);

    await expect(
      inventory.deleteMany({ where: { shopId: "s1" } })
    ).resolves.toEqual({ count: 2 });

    await expect(
      inventory.findMany({ where: { shopId: "s1" } })
    ).resolves.toHaveLength(0);
    await expect(
      inventory.findMany({ where: { shopId: "s2" } })
    ).resolves.toHaveLength(1);
  });

  it("delete throws when the item is missing", async () => {
    const inventory = createInventoryItemDelegate();
    await inventory.createMany({
      data: [{ shopId: "s1", sku: "a", variantKey: "v1", quantity: 1 }],
    });

    await expect(
      inventory.delete({
        where: {
          shopId_sku_variantKey: { shopId: "s1", sku: "a", variantKey: "v1" },
        },
      })
    ).resolves.toMatchObject({ sku: "a" });

    await expect(
      inventory.delete({
        where: {
          shopId_sku_variantKey: { shopId: "s1", sku: "a", variantKey: "v1" },
        },
      })
    ).rejects.toThrow("InventoryItem not found");
  });

  it("upsert updates existing items and creates new ones", async () => {
    const inventory = createInventoryItemDelegate();
    const where = {
      shopId_sku_variantKey: { shopId: "s1", sku: "a", variantKey: "v1" },
    };

    const created = await inventory.upsert({
      where,
      update: { quantity: 2 },
      create: { shopId: "s1", sku: "a", variantKey: "v1", quantity: 1 },
    });
    expect(created.quantity).toBe(1);

    const updated = await inventory.upsert({
      where,
      update: { quantity: 5 },
      create: { shopId: "s1", sku: "a", variantKey: "v1", quantity: 1 },
    });
    expect(updated.quantity).toBe(5);

    const createdNew = await inventory.upsert({
      where: {
        shopId_sku_variantKey: { shopId: "s1", sku: "b", variantKey: "v1" },
      },
      update: { quantity: 3 },
      create: { shopId: "s1", sku: "b", variantKey: "v1", quantity: 2 },
    });
    expect(createdNew.quantity).toBe(2);

    await expect(
      inventory.findMany({ where: { shopId: "s1" } })
    ).resolves.toHaveLength(2);
  });
});

