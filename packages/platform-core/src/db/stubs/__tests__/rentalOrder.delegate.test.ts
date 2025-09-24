/** @jest-environment node */
import { createRentalOrderDelegate } from "../rentalOrder";

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

