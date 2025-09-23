import type Stripe from "stripe";

describe("webhookHandlers/customerSubscriptionUpdated", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("syncs data using object customer id", async () => {
    const syncSubscriptionData = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ syncSubscriptionData }));

    const handler = (require("../customerSubscriptionUpdated").default) as typeof import("../customerSubscriptionUpdated").default;
    const subscription = { id: "sub_1", customer: { id: "cus_1" } } as unknown as Stripe.Subscription;
    const event = { data: { object: subscription } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_1", "sub_1");
  });

  test("syncs data using string customer id", async () => {
    const syncSubscriptionData = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ syncSubscriptionData }));
    const handler = (require("../customerSubscriptionUpdated").default) as typeof import("../customerSubscriptionUpdated").default;
    const subscription = { id: "sub_2", customer: "cus_2" } as unknown as Stripe.Subscription;
    const event = { data: { object: subscription } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_2", "sub_2");
  });
});

