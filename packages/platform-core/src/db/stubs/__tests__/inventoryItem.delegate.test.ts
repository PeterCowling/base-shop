/** @jest-environment node */
import { createInventoryItemDelegate } from "../inventoryItem";

describe("inventoryItem delegate", () => {
  it("handles CRUD operations", async () => {
    const d = createInventoryItemDelegate();
    await d.createMany({
      data: [
        { shopId: "s1", sku: "sku1", variantKey: "v1", stock: 1 },
        { shopId: "s1", sku: "sku2", variantKey: "v2", stock: 2 },
        { shopId: "s2", sku: "sku3", variantKey: "v3", stock: 3 },
      ],
    });
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(2);
    expect(
      await d.findUnique({
        where: {
          shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
        },
      })
    ).toHaveProperty("stock", 1);
    const updated = await d.upsert({
      where: {
        shopId_sku_variantKey: { shopId: "s1", sku: "sku1", variantKey: "v1" },
      },
      update: { stock: 5 },
      create: {},
    });
    expect(updated.stock).toBe(5);
    const deleted = await d.delete({
      where: {
        shopId_sku_variantKey: { shopId: "s1", sku: "sku2", variantKey: "v2" },
      },
    });
    expect(deleted.sku).toBe("sku2");
    await expect(
      d.delete({
        where: {
          shopId_sku_variantKey: {
            shopId: "s1",
            sku: "sku2",
            variantKey: "v2",
          },
        },
      })
    ).rejects.toThrow("InventoryItem not found");
  });

  it("creates a new record when upserting with a missing key", async () => {
    const d = createInventoryItemDelegate();
    const record = await d.upsert({
      where: {
        shopId_sku_variantKey: {
          shopId: "s1",
          sku: "sku4",
          variantKey: "v4",
        },
      },
      update: {},
      create: { stock: 4 },
    });
    expect(record).toMatchObject({
      shopId: "s1",
      sku: "sku4",
      variantKey: "v4",
      stock: 4,
    });
    const found = await d.findUnique({
      where: {
        shopId_sku_variantKey: {
          shopId: "s1",
          sku: "sku4",
          variantKey: "v4",
        },
      },
    });
    expect(found).not.toBeNull();
  });

  it("deleteMany removes only items matching shopId", async () => {
    const d = createInventoryItemDelegate();
    await d.createMany({
      data: [
        { shopId: "s1", sku: "sku1", variantKey: "v1", stock: 1 },
        { shopId: "s1", sku: "sku2", variantKey: "v2", stock: 2 },
        { shopId: "s2", sku: "sku3", variantKey: "v3", stock: 3 },
      ],
    });
    const result = await d.deleteMany({ where: { shopId: "s1" } });
    expect(result.count).toBe(2);
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(0);
    expect(await d.findMany({ where: { shopId: "s2" } })).toHaveLength(1);
  });
});

