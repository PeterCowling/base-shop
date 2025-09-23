import type Stripe from "stripe";

describe("webhookHandlers/customerSubscriptionDeleted", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("syncs data with null subscription id", async () => {
    const syncSubscriptionData = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ syncSubscriptionData }));

    const handler = (require("../customerSubscriptionDeleted").default) as typeof import("../customerSubscriptionDeleted").default;
    const subscription = { id: "sub_3", customer: { id: "cus_3" } } as unknown as Stripe.Subscription;
    const event = { data: { object: subscription } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_3", null);
  });
});

