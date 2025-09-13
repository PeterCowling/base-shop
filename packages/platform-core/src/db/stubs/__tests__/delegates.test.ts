/** @jest-environment node */
import { createCustomerMfaDelegate } from "../customerMfa";
import { createCustomerProfileDelegate } from "../customerProfile";
import { createInventoryItemDelegate } from "../inventoryItem";
import { createPageDelegate } from "../page";
import { createProductDelegate } from "../product";
import { createRentalOrderDelegate } from "../rentalOrder";
import { createReverseLogisticsEventDelegate } from "../reverseLogisticsEvent";
import { createSubscriptionUsageDelegate } from "../subscriptionUsage";
import { createUserDelegate } from "../user";

describe("customerMfa delegate", () => {
  it("upserts, finds and updates records", async () => {
    const d = createCustomerMfaDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s", enabled: false },
    });
    const updated = await d.upsert({
      where: { customerId: "c1" },
      update: { enabled: true },
      create: { customerId: "c1", secret: "x", enabled: false },
    });
    expect(updated.enabled).toBe(true);
    expect(await d.findUnique({ where: { customerId: "c1" } })).toEqual({
      customerId: "c1",
      secret: "s",
      enabled: true,
    });
    expect(await d.findUnique({ where: { customerId: "missing" } })).toBeNull();
    const afterUpdate = await d.update({
      where: { customerId: "c1" },
      data: { secret: "new" },
    });
    expect(afterUpdate.secret).toBe("new");
    await expect(
      d.update({ where: { customerId: "nope" }, data: { enabled: true } })
    ).rejects.toThrow("CustomerMfa not found");
  });
});

describe("customerProfile delegate", () => {
  it("supports find and upsert operations", async () => {
    const d = createCustomerProfileDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", name: "A", email: "a@test.com" },
    });
    await d.upsert({
      where: { customerId: "c2" },
      update: {},
      create: { customerId: "c2", name: "B", email: "a@test.com" },
    });
    expect(
      await d.findUnique({ where: { customerId: "c1" } })
    ).toHaveProperty("name", "A");
    expect(
      await d.findUnique({ where: { customerId: "missing" } })
    ).toBeNull();
    const first = await d.findFirst({
      where: { email: "a@test.com", NOT: { customerId: "c1" } },
    });
    expect(first?.customerId).toBe("c2");
    const updated = await d.upsert({
      where: { customerId: "c1" },
      update: { name: "A2" },
      create: { customerId: "c1", name: "A2", email: "a@test.com" },
    });
    expect(updated.name).toBe("A2");
  });
});

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
    await d.upsert({
      where: {
        shopId_sku_variantKey: { shopId: "s1", sku: "sku4", variantKey: "v4" },
      },
      update: {},
      create: { shopId: "s1", sku: "sku4", variantKey: "v4", stock: 4 },
    });
    const deleted = await d.delete({
      where: {
        shopId_sku_variantKey: { shopId: "s1", sku: "sku2", variantKey: "v2" },
      },
    });
    expect(deleted.sku).toBe("sku2");
    await expect(
      d.delete({
        where: {
          shopId_sku_variantKey: { shopId: "s1", sku: "none", variantKey: "none" },
        },
      })
    ).rejects.toThrow("InventoryItem not found");
    const result = await d.deleteMany({ where: { shopId: "s1" } });
    expect(result.count).toBe(2);
  });
});

describe("page delegate", () => {
  it("creates, finds, updates and upserts pages", async () => {
    const d = createPageDelegate();
    await d.createMany({
      data: [
        { id: "1", shopId: "s1", title: "a" },
        { id: "2", shopId: "s2", title: "b" },
      ],
    });
    expect(await d.findMany({ where: { shopId: "s1" } })).toEqual([
      { id: "1", shopId: "s1", title: "a" },
    ]);
    const upd = await d.update({ where: { id: "1" }, data: { title: "A" } });
    expect(upd.title).toBe("A");
    const upsertExisting = await d.upsert({
      where: { id: "1" },
      update: { title: "AA" },
      create: { id: "1", shopId: "s1", title: "AA" },
    });
    expect(upsertExisting.title).toBe("AA");
    await d.upsert({
      where: { id: "3" },
      update: { title: "c" },
      create: { id: "3", shopId: "s1", title: "c" },
    });
    expect((await d.findMany()).length).toBe(3);
  });
});

describe("product delegate", () => {
  it("manages product records", async () => {
    const d = createProductDelegate();
    await d.createMany({
      data: [
        { id: "p1", shopId: "s1", name: "a" },
        { id: "p2", shopId: "s1", name: "b" },
        { id: "p3", shopId: "s2", name: "c" },
      ],
    });
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(2);
    expect(
      await d.findUnique({ where: { shopId_id: { shopId: "s1", id: "p1" } } })
    ).toHaveProperty("name", "a");
    expect(
      await d.findUnique({ where: { shopId_id: { shopId: "s9", id: "p1" } } })
    ).toBeNull();
    expect(await d.findUnique({ where: { id: "p1" } })).toBeNull();
    const updated = await d.update({
      where: { shopId_id: { shopId: "s1", id: "p1" } },
      data: { name: "aa" },
    });
    expect(updated.name).toBe("aa");
    await expect(
      d.update({
        where: { shopId_id: { shopId: "s9", id: "p9" } },
        data: { name: "x" },
      })
    ).rejects.toThrow("Product not found");
    await d.create({ data: { id: "p4", shopId: "s1", name: "d" } });
    const removed = await d.delete({
      where: { shopId_id: { shopId: "s1", id: "p2" } },
    });
    expect(removed.id).toBe("p2");
    await expect(
      d.delete({ where: { shopId_id: { shopId: "s1", id: "p2" } } })
    ).rejects.toThrow("Product not found");
    const delMany = await d.deleteMany({ where: { shopId: "s1" } });
    expect(delMany.count).toBe(2);
    expect(await d.findMany({ where: { shopId: "s1" } })).toHaveLength(0);
    await d.create({ data: { id: "p5", shopId: "s3", name: "e" } });
    const delShop3 = await d.deleteMany({ where: { shopId: "s3" } });
    expect(delShop3.count).toBe(1);
    expect(await d.findMany({ where: { shopId: "s3" } })).toHaveLength(0);
  });
});

describe("rentalOrder delegate", () => {
  it("supports lookups and updates", async () => {
    const d = createRentalOrderDelegate();
    await d.create({
      data: {
        shop: "s1",
        sessionId: "sess1",
        customerId: "c1",
        trackingNumber: "t1",
      },
    });
    await d.create({ data: { shop: "s1", sessionId: "sess2" } });
    expect((await d.findMany()).length).toBe(2);
    expect((await d.findMany({ where: { shop: "s1" } })).length).toBe(2);
    expect(
      (await d.findMany({ where: { shop: "s1", customerId: "c1" } })).length
    ).toBe(1);
    expect(
      await d.findUnique({
        where: { shop_sessionId: { shop: "s1", sessionId: "sess1" } },
      })
    ).toHaveProperty("trackingNumber", "t1");
    const bySession = await d.update({
      where: { shop_sessionId: { shop: "s1", sessionId: "sess2" } },
      data: { customerId: "c2" },
    });
    expect(bySession.customerId).toBe("c2");
    const byTracking = await d.update({
      where: { shop_trackingNumber: { shop: "s1", trackingNumber: "t1" } },
      data: { customerId: "c3" },
    });
    expect(byTracking.customerId).toBe("c3");
    await expect(
      d.update({
        where: { shop_sessionId: { shop: "s1", sessionId: "missing" } },
        data: {},
      })
    ).rejects.toThrow("Order not found");
  });
});

describe("reverseLogisticsEvent delegate", () => {
  it("creates and filters events", async () => {
    const d = createReverseLogisticsEventDelegate();
    await d.create({ data: { id: 1, type: "scan", trackingNumber: "t1" } });
    await d.createMany({
      data: [
        { id: 2, type: "scan", trackingNumber: "t2" },
        { id: 3, type: "delivered", trackingNumber: "t1" },
      ],
    });
    const t1Events = await d.findMany({ where: { trackingNumber: "t1" } });
    expect(t1Events).toHaveLength(2);
  });
});

describe("subscriptionUsage delegate", () => {
  it("upserts usage records", async () => {
    const d = createSubscriptionUsageDelegate();
    expect(await d.findUnique({ where: { id: "1" } })).toBeNull();
    await d.upsert({
      where: { id: "1" },
      update: {},
      create: { id: "1", count: 1 },
    });
    const updated = await d.upsert({
      where: { id: "1" },
      update: { count: 2 },
      create: { id: "1", count: 2 },
    });
    expect(updated.count).toBe(2);
    const found = await d.findUnique({ where: { id: "1" } });
    expect(found?.count).toBe(2);
  });
});

describe("user delegate", () => {
  it("performs lookups and updates", async () => {
    const d = createUserDelegate();
    expect(await d.findUnique({ where: { id: "user1" } })).toHaveProperty(
      "email",
      "u1@test.com"
    );
    expect(
      await d.findUnique({
        where: { id: "user1", NOT: { email: "u1@test.com" } },
      })
    ).toBeNull();
    expect(await d.findFirst({ where: { email: "u2@test.com" } })).toHaveProperty(
      "id",
      "user2"
    );
    await d.create({ data: { id: "user3", email: "u3@test.com" } });
    const updated = await d.update({
      where: { id: "user3" },
      data: { email: "new@test.com" },
    });
    expect(updated.email).toBe("new@test.com");
    await expect(
      d.update({ where: { id: "missing" }, data: { email: "x" } })
    ).rejects.toThrow("User not found");
  });
});
