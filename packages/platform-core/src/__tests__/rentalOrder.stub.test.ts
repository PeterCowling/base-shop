/** @jest-environment node */

import { createTestPrismaStub } from "../db";

describe("rentalOrder stub delegate", () => {
  it("creates orders and finds them by shop_sessionId", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({
      data: { shop: "s1", sessionId: "sess1", customerId: "c1", trackingNumber: "t1" },
    });

    const order = await prisma.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "s1", sessionId: "sess1" } },
    });

    expect(order).toMatchObject({ shop: "s1", sessionId: "sess1", trackingNumber: "t1", customerId: "c1" });
  });

  it("findUnique returns null for absent shop_sessionId", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "1" } });

    const order = await prisma.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "s1", sessionId: "missing" } },
    });

    expect(order).toBeNull();
  });

  it("findMany filters by shop and customerId", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "1", customerId: "c1" } });
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "2", customerId: "c2" } });
    await prisma.rentalOrder.create({ data: { shop: "s2", sessionId: "3", customerId: "c1" } });

    expect(await prisma.rentalOrder.findMany({ where: { shop: "s1" } })).toHaveLength(2);
    expect(await prisma.rentalOrder.findMany({ where: { customerId: "c1" } })).toHaveLength(2);
    expect(
      await prisma.rentalOrder.findMany({ where: { shop: "s1", customerId: "c1" } }),
    ).toMatchObject([{ shop: "s1", sessionId: "1", customerId: "c1" }]);
  });

  it("findMany with no where returns all orders", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "1" } });
    await prisma.rentalOrder.create({ data: { shop: "s2", sessionId: "2" } });

    expect(await prisma.rentalOrder.findMany()).toHaveLength(2);
  });

  it("updates orders via shop_sessionId", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "1" } });

    const updated = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop: "s1", sessionId: "1" } },
      data: { trackingNumber: "tn" },
    });

    expect(updated.trackingNumber).toBe("tn");
  });

  it("update via shop_sessionId throws when order missing", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({ data: { shop: "s1", sessionId: "1" } });

    await expect(
      prisma.rentalOrder.update({
        where: { shop_sessionId: { shop: "s1", sessionId: "2" } },
        data: { trackingNumber: "tn" },
      }),
    ).rejects.toThrow("Order not found");
  });

  it("updates via shop_trackingNumber and errors when order missing", async () => {
    const prisma = createTestPrismaStub();
    await prisma.rentalOrder.create({
      data: { shop: "s1", sessionId: "1", trackingNumber: "tn1" },
    });

    const updated = await prisma.rentalOrder.update({
      where: { shop_trackingNumber: { shop: "s1", trackingNumber: "tn1" } },
      data: { customerId: "c2" },
    });
    expect(updated.customerId).toBe("c2");

    await expect(
      prisma.rentalOrder.update({
        where: { shop_trackingNumber: { shop: "s1", trackingNumber: "missing" } },
        data: { customerId: "c3" },
      }),
    ).rejects.toThrow("Order not found");
  });
});
