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

  it("supports customerProfile CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.customerProfile.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", name: "Alice", email: "a@b.com" },
    });
    let profile = await db.customerProfile.findUnique({
      where: { customerId: "c1" },
    });
    expect(profile?.name).toBe("Alice");
    await db.customerProfile.upsert({
      where: { customerId: "c1" },
      update: { name: "Bob" },
      create: { customerId: "c1", name: "Bob", email: "a@b.com" },
    });
    profile = await db.customerProfile.findFirst({ where: { email: "a@b.com" } });
    expect(profile?.name).toBe("Bob");
  });

  it("supports customerMfa CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.customerMfa.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s1", enabled: false },
    });
    let mfa = await db.customerMfa.findUnique({ where: { customerId: "c1" } });
    expect(mfa?.secret).toBe("s1");
    await db.customerMfa.update({
      where: { customerId: "c1" },
      data: { enabled: true },
    });
    mfa = await db.customerMfa.findUnique({ where: { customerId: "c1" } });
    expect(mfa?.enabled).toBe(true);
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

  it("supports product CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.product.createMany({
      data: [
        { shopId: "s1", id: "p1" },
        { shopId: "s1", id: "p2" },
      ],
    });
    let products = await db.product.findMany({ where: { shopId: "s1" } });
    expect(products).toHaveLength(2);
    await db.product.update({
      where: { shopId_id: { shopId: "s1", id: "p1" } },
      data: { title: "t" },
    });
    const unique = await db.product.findUnique({
      where: { shopId_id: { shopId: "s1", id: "p1" } },
    });
    expect(unique?.title).toBe("t");
    await db.product.delete({ where: { shopId_id: { shopId: "s1", id: "p2" } } });
    products = await db.product.findMany({ where: { shopId: "s1" } });
    expect(products).toHaveLength(1);
    await db.product.deleteMany({ where: { shopId: "s1" } });
    products = await db.product.findMany({ where: { shopId: "s1" } });
    expect(products).toHaveLength(0);
  });

  it("supports page CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.page.createMany({ data: [{ id: "pg1", shopId: "s1" }] });
    let pages = await db.page.findMany({ where: { shopId: "s1" } });
    expect(pages).toHaveLength(1);
    await db.page.update({ where: { id: "pg1" }, data: { title: "t" } });
    pages = await db.page.findMany({ where: { shopId: "s1" } });
    expect(pages[0].title).toBe("t");
    await db.page.deleteMany({ where: { id: "pg1" } });
    pages = await db.page.findMany({ where: { shopId: "s1" } });
    expect(pages).toHaveLength(0);
  });

  it("supports user CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.user.create({ data: { id: "u1", email: "e" } });
    let user = await db.user.findUnique({ where: { id: "u1" } });
    expect(user?.email).toBe("e");
    await db.user.update({ where: { id: "u1" }, data: { email: "e2" } });
    user = await db.user.findFirst({ where: { email: "e2" } });
    expect(user?.email).toBe("e2");
  });

  it("supports subscriptionUsage CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.subscriptionUsage.upsert({
      where: { id: "su1" },
      update: { count: 1 },
      create: { id: "su1", count: 1 },
    });
    const usage = await db.subscriptionUsage.findUnique({ where: { id: "su1" } });
    expect(usage?.count).toBe(1);
  });

  it("supports reverseLogisticsEvent CRUD operations", async () => {
    const db = createTestPrismaStub();
    await db.reverseLogisticsEvent.create({ data: { id: "e1", type: "t" } });
    const events = await db.reverseLogisticsEvent.findMany({ where: { type: "t" } });
    expect(events).toHaveLength(1);
  });

  it("supports shop delegate", async () => {
    const db = createTestPrismaStub();
    const shop = await db.shop.findUnique({ where: { id: "s1" } });
    expect(shop).toEqual({ data: {} });
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

