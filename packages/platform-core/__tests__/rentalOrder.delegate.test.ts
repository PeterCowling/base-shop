import { createRentalOrderDelegate } from "../src/db/stubs/rentalOrder";

describe("createRentalOrderDelegate", () => {
  it("filters findMany by shop and customerId", async () => {
    const delegate = createRentalOrderDelegate();
    await delegate.create({ data: { shop: "s1", sessionId: "a", customerId: "c1" } });
    await delegate.create({ data: { shop: "s1", sessionId: "b", customerId: "c2" } });
    await delegate.create({ data: { shop: "s2", sessionId: "c", customerId: "c1" } });

    const shopOrders = await delegate.findMany({ where: { shop: "s1" } });
    expect(shopOrders).toHaveLength(2);

    const custOrders = await delegate.findMany({ where: { shop: "s1", customerId: "c2" } });
    expect(custOrders).toHaveLength(1);
    expect(custOrders[0].sessionId).toBe("b");
  });

  it("returns null from findUnique when shop_sessionId is missing", async () => {
    const delegate = createRentalOrderDelegate();
    await delegate.create({ data: { shop: "s1", sessionId: "sess1" } });

    const found = await delegate.findUnique({
      where: { shop_sessionId: { shop: "s1", sessionId: "sess1" } },
    });
    expect(found).toEqual({ shop: "s1", sessionId: "sess1" });

    const missing = await delegate.findUnique({ where: { shop: "s1", sessionId: "sess1" } });
    expect(missing).toBeNull();
  });

  it("updates via shop_sessionId and shop_trackingNumber and throws when no match", async () => {
    const delegate = createRentalOrderDelegate();
    await delegate.create({ data: { shop: "s1", sessionId: "a", trackingNumber: "t1" } });
    await delegate.create({ data: { shop: "s1", sessionId: "b", trackingNumber: "t2" } });

    const bySession = await delegate.update({
      where: { shop_sessionId: { shop: "s1", sessionId: "a" } },
      data: { customerId: "c1" },
    });
    expect(bySession.customerId).toBe("c1");

    const byTracking = await delegate.update({
      where: { shop_trackingNumber: { shop: "s1", trackingNumber: "t2" } },
      data: { customerId: "c2" },
    });
    expect(byTracking.customerId).toBe("c2");

    await expect(
      delegate.update({
        where: { shop_sessionId: { shop: "s1", sessionId: "missing" } },
        data: {},
      }),
    ).rejects.toThrow("Order not found");

    await expect(
      delegate.update({
        where: { shop_trackingNumber: { shop: "s1", trackingNumber: "missing" } },
        data: {},
      }),
    ).rejects.toThrow("Order not found");
  });
});

