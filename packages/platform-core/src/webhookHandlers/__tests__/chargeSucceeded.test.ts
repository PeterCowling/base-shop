import type Stripe from "stripe";

describe("webhookHandlers/chargeSucceeded", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("delegates to persistRiskFromCharge with shop and charge", async () => {
    const persistRiskFromCharge = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../helpers/risk", () => ({
      persistRiskFromCharge,
    }));

    const handler = (require("../chargeSucceeded").default) as typeof import("../chargeSucceeded").default;

    const charge = { id: "ch_123", outcome: { risk_level: "normal" } } as unknown as Stripe.Charge;
    const event = { data: { object: charge } } as unknown as Stripe.Event;

    await handler("demo-shop", event);
    expect(persistRiskFromCharge).toHaveBeenCalledWith("demo-shop", charge);
  });
});

