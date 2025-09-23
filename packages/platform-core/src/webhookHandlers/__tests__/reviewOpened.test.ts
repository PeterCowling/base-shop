import type Stripe from "stripe";

describe("webhookHandlers/reviewOpened", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("flags risk when charge id present as string", async () => {
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    const handler = (require("../reviewOpened").default) as typeof import("../reviewOpened").default;

    const review = { charge: "ch_123" } as unknown as Stripe.Review;
    const event = { data: { object: review } } as unknown as Stripe.Event;

    await handler("shop1", event);
    expect(updateRisk).toHaveBeenCalledWith("shop1", "ch_123", undefined, undefined, true);
  });

  test("no-op when charge is missing", async () => {
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    const handler = (require("../reviewOpened").default) as typeof import("../reviewOpened").default;

    const review = { charge: null } as unknown as Stripe.Review;
    const event = { data: { object: review } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(updateRisk).not.toHaveBeenCalled();
  });
});

