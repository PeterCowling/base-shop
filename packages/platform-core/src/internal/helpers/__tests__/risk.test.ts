import type Stripe from "stripe";

describe("internal/helpers/risk", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("extractSessionIdFromCharge resolves from latest_charge.invoice", async () => {
    const { extractSessionIdFromCharge } =
      require("../risk") as typeof import("../risk");
    const charge = {
      id: "ch_1",
      payment_intent: {
        latest_charge: { invoice: "in_abc" },
      },
    } as unknown as Stripe.Charge;
    expect(extractSessionIdFromCharge(charge as any)).toBe("in_abc");
  });

  test("persistRiskFromCharge calls updateRisk with derived values", async () => {
    const updateRisk = jest.fn().mockResolvedValue(null);
    jest.doMock("../../../orders/risk", () => ({ updateRisk }));
    const { persistRiskFromCharge } =
      require("../risk") as typeof import("../risk");
    const charge = {
      id: "ch_2",
      outcome: { risk_level: "elevated", risk_score: 67 },
      payment_intent: {
        latest_charge: { invoice: "in_def" },
      },
    } as unknown as Stripe.Charge;
    await persistRiskFromCharge("shop1", charge as any);
    expect(updateRisk).toHaveBeenCalledWith("shop1", "in_def", "elevated", 67);
  });
});
