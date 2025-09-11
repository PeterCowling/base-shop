import { createTestPrismaStub } from "../src/db";

describe("createTestPrismaStub", () => {
  it("supports rentalOrder CRUD operations", async () => {
    const db = createTestPrismaStub();
    const orderData = {
      shop: "shop1",
      sessionId: "sess1",
      customerId: "cust1",
    };

    const created = await db.rentalOrder.create({ data: orderData });
    expect(created).toEqual(orderData);

    const found = await db.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "shop1", sessionId: "sess1" } },
    });
    expect(found).toEqual(orderData);

    const updated = await db.rentalOrder.update({
      where: { shop_sessionId: { shop: "shop1", sessionId: "sess1" } },
      data: { trackingNumber: "tn1" },
    });
    expect(updated.trackingNumber).toBe("tn1");

    const all = await db.rentalOrder.findMany({ where: { shop: "shop1" } });
    expect(all).toHaveLength(1);
    expect(all[0].trackingNumber).toBe("tn1");
  });

  it("supports inventoryItem CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.inventoryItem.createMany({
      data: [
        { shopId: "shop1", sku: "sku1", variantKey: "v1", quantity: 1 },
        { shopId: "shop1", sku: "sku2", variantKey: "v1", quantity: 2 },
      ],
    });

    let items = await db.inventoryItem.findMany({ where: { shopId: "shop1" } });
    expect(items).toHaveLength(2);

    const unique = await db.inventoryItem.findUnique({
      where: {
        shopId_sku_variantKey: {
          shopId: "shop1",
          sku: "sku1",
          variantKey: "v1",
        },
      },
    });
    expect(unique?.quantity).toBe(1);

    await db.inventoryItem.upsert({
      where: {
        shopId_sku_variantKey: {
          shopId: "shop1",
          sku: "sku1",
          variantKey: "v1",
        },
      },
      update: { quantity: 5 },
      create: {
        shopId: "shop1",
        sku: "sku1",
        variantKey: "v1",
        quantity: 5,
      },
    });

    items = await db.inventoryItem.findMany({ where: { shopId: "shop1" } });
    expect(items.find((i) => i.sku === "sku1")?.quantity).toBe(5);

    await db.inventoryItem.delete({
      where: {
        shopId_sku_variantKey: {
          shopId: "shop1",
          sku: "sku2",
          variantKey: "v1",
        },
      },
    });

    items = await db.inventoryItem.findMany({ where: { shopId: "shop1" } });
    expect(items).toHaveLength(1);

    await db.inventoryItem.deleteMany({ where: { shopId: "shop1" } });
    items = await db.inventoryItem.findMany({ where: { shopId: "shop1" } });
    expect(items).toHaveLength(0);
  });

  it("wraps multiple mutations in $transaction", async () => {
    const db = createTestPrismaStub();
    await db.$transaction(async (tx) => {
      await tx.rentalOrder.create({
        data: { shop: "shop1", sessionId: "t1" },
      });
      await tx.inventoryItem.createMany({
        data: [
          { shopId: "shop1", sku: "sku1", variantKey: "v1", quantity: 1 },
        ],
      });
    });

    const orders = await db.rentalOrder.findMany({ where: { shop: "shop1" } });
    const items = await db.inventoryItem.findMany({ where: { shopId: "shop1" } });
    expect(orders).toHaveLength(1);
    expect(items).toHaveLength(1);
  });
});

