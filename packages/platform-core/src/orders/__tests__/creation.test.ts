describe("orders/creation", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("addOrder creates order, tracks, and increments usage when subscriptions enabled", async () => {
    const create = jest.fn().mockResolvedValue({});
    const findUnique = jest.fn().mockResolvedValue({ data: { subscriptionsEnabled: true } });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { create }, shop: { findUnique } } }));

    const trackOrder = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../analytics", () => ({ trackOrder }));

    const incrementSubscriptionUsage = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../subscriptionUsage", () => ({ incrementSubscriptionUsage }));

    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));

    const { addOrder } = require("../creation") as typeof import("../creation");

    const order = await addOrder({
      shop: "shop1",
      sessionId: "sess1",
      deposit: 100,
      expectedReturnDate: "2025-02-01",
      customerId: "cus_1",
      riskLevel: "elevated",
      riskScore: 55,
      flaggedForReview: true,
    });

    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ shop: "shop1", sessionId: "sess1", deposit: 100 }) });
    expect(trackOrder).toHaveBeenCalledWith("shop1", expect.any(String), 100);
    expect(incrementSubscriptionUsage).toHaveBeenCalledWith("shop1", "cus_1", "2025-01");
    expect(order).toEqual(expect.objectContaining({ shop: "shop1", sessionId: "sess1", deposit: 100 }));
  });

  test("addOrder skips usage increment when no customerId or subscriptions disabled", async () => {
    const create = jest.fn().mockResolvedValue({});
    const findUnique = jest.fn().mockResolvedValue({ data: { subscriptionsEnabled: false } });
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { create }, shop: { findUnique } } }));
    const trackOrder = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../analytics", () => ({ trackOrder }));
    const incrementSubscriptionUsage = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../subscriptionUsage", () => ({ incrementSubscriptionUsage }));
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => "2025-01-15T12:00:00Z" }));

    const { addOrder } = require("../creation") as typeof import("../creation");
    await addOrder({ shop: "shop1", sessionId: "sess2", deposit: 50 });
    expect(trackOrder).toHaveBeenCalled();
    expect(incrementSubscriptionUsage).not.toHaveBeenCalled();
  });

  test("listOrders and getOrdersForCustomer normalize results", async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: "o1" }, { id: "o2" }]);
    jest.doMock("../../db", () => ({ prisma: { rentalOrder: { findMany } } }));
    const normalize = jest.fn((o: any) => ({ ...o, normalized: true }));
    jest.doMock("../utils", () => ({ normalize }));

    const mod = require("../creation") as typeof import("../creation");
    const list = await mod.listOrders("shopA");
    expect(list).toEqual([
      { id: "o1", normalized: true },
      { id: "o2", normalized: true },
    ]);

    (findMany as jest.Mock).mockResolvedValueOnce([{ id: "oc1" }]);
    const listForCustomer = await mod.getOrdersForCustomer("shopA", "cusA");
    expect(listForCustomer).toEqual([{ id: "oc1", normalized: true }]);
  });
});
