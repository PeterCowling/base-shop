import type Stripe from "stripe";

describe("webhookHandlers/radarEarlyFraudWarning", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("updates risk and marks refunded when high risk", async () => {
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    const markRefunded = jest.fn().mockResolvedValue(undefined);
    const charges = { retrieve: jest.fn().mockResolvedValue({ outcome: { risk_level: "highest", risk_score: 90 } }) };
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    jest.doMock("../../orders/refunds", () => ({ markRefunded }));
    jest.doMock("@acme/stripe", () => ({ stripe: { charges } }));

    const handler = (require("../radarEarlyFraudWarning").default) as typeof import("../radarEarlyFraudWarning").default;

    const warning = { charge: "ch_1" } as unknown as Stripe.Radar.EarlyFraudWarning;
    const event = { data: { object: warning } } as unknown as Stripe.Event;

    await handler("shop1", event);

    expect(charges.retrieve).toHaveBeenCalledWith("ch_1");
    expect(updateRisk).toHaveBeenCalledWith("shop1", "ch_1", "highest", 90, true);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "ch_1");
  });

  test("updates risk only when moderate risk", async () => {
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    const markRefunded = jest.fn().mockResolvedValue(undefined);
    const charges = { retrieve: jest.fn().mockResolvedValue({ outcome: { risk_level: "elevated", risk_score: 60 } }) };
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    jest.doMock("../../orders/refunds", () => ({ markRefunded }));
    jest.doMock("@acme/stripe", () => ({ stripe: { charges } }));

    const handler = (require("../radarEarlyFraudWarning").default) as typeof import("../radarEarlyFraudWarning").default;

    const warning = { charge: "ch_2" } as unknown as Stripe.Radar.EarlyFraudWarning;
    const event = { data: { object: warning } } as unknown as Stripe.Event;

    await handler("shop1", event);

    expect(updateRisk).toHaveBeenCalledWith("shop1", "ch_2", "elevated", 60, true);
    expect(markRefunded).not.toHaveBeenCalled();
  });
});

