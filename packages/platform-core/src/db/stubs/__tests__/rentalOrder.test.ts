/** @jest-environment node */
import { createRentalOrderDelegate } from "../rentalOrder";

describe("rentalOrder delegate", () => {
  it("filters, updates and validates records", async () => {
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
    await d.create({
      data: { shop: "s2", sessionId: "sess3", customerId: "c1", trackingNumber: "t2" },
    });

    // findMany should filter by customerId
    expect((await d.findMany({ where: { customerId: "c1" } })).length).toBe(2);
    expect((await d.findMany({ where: { shop: "s1", customerId: "c1" } })).length).toBe(1);
    expect((await d.findMany({ where: { customerId: "c2" } })).length).toBe(0);

    // findUnique returns null when keys are absent
    expect(
      await d.findUnique({
        where: { shop_trackingNumber: { shop: "s1", trackingNumber: "t1" } },
      })
    ).toBeNull();

    // valid lookup by sessionId
    expect(
      await d.findUnique({
        where: { shop_sessionId: { shop: "s1", sessionId: "sess1" } },
      })
    ).toHaveProperty("trackingNumber", "t1");

    // update by sessionId
    const bySession = await d.update({
      where: { shop_sessionId: { shop: "s1", sessionId: "sess2" } },
      data: { customerId: "c2" },
    });
    expect(bySession.customerId).toBe("c2");

    // update by trackingNumber
    const byTracking = await d.update({
      where: { shop_trackingNumber: { shop: "s1", trackingNumber: "t1" } },
      data: { customerId: "c3" },
    });
    expect(byTracking.customerId).toBe("c3");

    // update should throw when no matching sessionId or trackingNumber
    await expect(
      d.update({
        where: { shop_sessionId: { shop: "s1", sessionId: "missing" } },
        data: {},
      })
    ).rejects.toThrow("Order not found");
    await expect(
      d.update({
        where: { shop_trackingNumber: { shop: "s1", trackingNumber: "missing" } },
        data: {},
      })
    ).rejects.toThrow("Order not found");
  });
});
