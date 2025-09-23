describe("repositories/subscriptions.server", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("updateSubscriptionPaymentStatus writes subscription id for user", async () => {
    const update = jest.fn().mockResolvedValue({});
    jest.doMock("../../db", () => ({ prisma: { user: { update } } }));
    const mod = require("../subscriptions.server") as typeof import("../subscriptions.server");
    await mod.updateSubscriptionPaymentStatus("cus_1", "sub_1", "succeeded");
    expect(update).toHaveBeenCalledWith({
      where: { id: "cus_1" },
      data: { stripeSubscriptionId: "sub_1" },
    });
  });

  test("syncSubscriptionData writes null to clear subscription id", async () => {
    const update = jest.fn().mockResolvedValue({});
    jest.doMock("../../db", () => ({ prisma: { user: { update } } }));
    const mod = require("../subscriptions.server") as typeof import("../subscriptions.server");
    await mod.syncSubscriptionData("cus_2", null);
    expect(update).toHaveBeenCalledWith({
      where: { id: "cus_2" },
      data: { stripeSubscriptionId: null },
    });
  });
});

