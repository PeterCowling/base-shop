/** @jest-environment node */

import { createInventoryItemDelegate } from "../db/stubs";

describe("createInventoryItemDelegate", () => {
  it("stores items and filters by shopId", async () => {
    const inventory = createInventoryItemDelegate();
    await inventory.createMany({
      data: [
        { shopId: "s1", sku: "a", variantKey: "v", quantity: 1 },
        { shopId: "s1", sku: "b", variantKey: "v", quantity: 2 },
        { shopId: "s2", sku: "c", variantKey: "v", quantity: 3 },
      ],
    });

    await expect(
      inventory.findMany({ where: { shopId: "s1" } }),
    ).resolves.toHaveLength(2);
    await expect(
      inventory.findMany({ where: { shopId: "s2" } }),
    ).resolves.toHaveLength(1);
  });

  it("deleteMany removes items for a shop", async () => {
    const inventory = createInventoryItemDelegate();
    await inventory.createMany({
      data: [
        { shopId: "s1", sku: "a", variantKey: "v1", quantity: 1 },
        { shopId: "s1", sku: "b", variantKey: "v1", quantity: 2 },
        { shopId: "s2", sku: "c", variantKey: "v1", quantity: 3 },
      ],
    });

    await expect(
      inventory.deleteMany({ where: { shopId: "s1" } }),
    ).resolves.toEqual({ count: 2 });
    await expect(
      inventory.findMany({ where: { shopId: "s1" } }),
    ).resolves.toHaveLength(0);
    await expect(
      inventory.findMany({ where: { shopId: "s2" } }),
    ).resolves.toHaveLength(1);
  });

  it(
    "deleteMany for missing shopId returns count 0 and leaves existing items",
    async () => {
      const inventory = createInventoryItemDelegate();
      await inventory.createMany({
        data: [
          { shopId: "s2", sku: "c", variantKey: "v1", quantity: 3 },
          { shopId: "s2", sku: "d", variantKey: "v1", quantity: 4 },
        ],
      });

      await expect(
        inventory.deleteMany({ where: { shopId: "s1" } }),
      ).resolves.toEqual({ count: 0 });
      await expect(
        inventory.findMany({ where: { shopId: "s2" } }),
      ).resolves.toHaveLength(2);
    },
  );

  describe("composite key operations", () => {
    it("findUnique honours {shopId, sku, variantKey} and throws when missing", async () => {
      const inventory = createInventoryItemDelegate();
      await inventory.createMany({
        data: [{ shopId: "s1", sku: "sku1", variantKey: "v1", quantity: 1 }],
      });

      await expect(
        inventory.findUnique({
          where: {
            shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
          },
        }),
      ).resolves.toMatchObject({ quantity: 1 });

      await expect(
        inventory.findUnique({
          where: {
            shopId_sku_variantKey: { shopId: "s1", sku: "missing", variantKey: "v1" },
          },
        }),
      ).resolves.toBeNull();

      await expect(
        inventory.findUnique({ where: {} as any }),
      ).rejects.toThrow();
    });

    it("delete honours {shopId, sku, variantKey} and throws when missing", async () => {
      const inventory = createInventoryItemDelegate();
      await inventory.createMany({
        data: [{ shopId: "s1", sku: "sku1", variantKey: "v1", quantity: 1 }],
      });

      await expect(
        inventory.delete({
          where: {
            shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
          },
        }),
      ).resolves.toMatchObject({ sku: "sku1" });

      await expect(
        inventory.delete({
          where: {
            shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
          },
        }),
      ).rejects.toThrow("InventoryItem not found");

      await expect(
        inventory.delete({ where: {} as any }),
      ).rejects.toThrow();
    });

    it("upsert honours {shopId, sku, variantKey} and throws when missing", async () => {
      const inventory = createInventoryItemDelegate();
      const where = {
        shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
      };

      const created = await inventory.upsert({
        where,
        update: { quantity: 2 },
        create: { shopId: "s1", sku: "sku1", variantKey: "v1", quantity: 1 },
      });
      expect(created.quantity).toBe(1);

      const updated = await inventory.upsert({
        where,
        update: { quantity: 5 },
        create: { shopId: "s1", sku: "sku1", variantKey: "v1", quantity: 1 },
      });
      expect(updated.quantity).toBe(5);

      await expect(
        inventory.upsert({
          where: {} as any,
          update: { quantity: 1 },
          create: { shopId: "s1", sku: "sku2", variantKey: "v1", quantity: 1 },
        }),
      ).rejects.toThrow();
    });
  });
});

