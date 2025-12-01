import type Stripe from "stripe";

describe("webhookHandlers/paymentIntentSucceeded", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("persists risk when latest_charge is object", async () => {
    const persistRiskFromCharge = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../internal/helpers/risk", () => ({
      persistRiskFromCharge,
    }));
    const handler = (require("../paymentIntentSucceeded").default) as typeof import("../paymentIntentSucceeded").default;

    const pi = {
      latest_charge: { id: "ch_1", outcome: { risk_level: "normal" } },
    } as unknown as Stripe.PaymentIntent;
    const event = { data: { object: pi } } as unknown as Stripe.Event;

    await handler("shop1", event);
    expect(persistRiskFromCharge).toHaveBeenCalledWith("shop1", expect.objectContaining({ id: "ch_1" }));
  });

  test("does nothing when latest_charge is a string", async () => {
    const persistRiskFromCharge = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../internal/helpers/risk", () => ({
      persistRiskFromCharge,
    }));
    const handler = (require("../paymentIntentSucceeded").default) as typeof import("../paymentIntentSucceeded").default;

    const pi = { latest_charge: "ch_2" } as unknown as Stripe.PaymentIntent;
    const event = { data: { object: pi } } as unknown as Stripe.Event;

    await handler("shop2", event);
    expect(persistRiskFromCharge).not.toHaveBeenCalled();
  });
});
