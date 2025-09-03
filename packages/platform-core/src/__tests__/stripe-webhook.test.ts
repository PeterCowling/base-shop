/** @jest-environment node */

function mockStripe() {
  jest.doMock("@acme/stripe", () => ({
    __esModule: true,
    stripe: {
      reviews: { create: jest.fn() },
      paymentIntents: { update: jest.fn() },
      charges: { retrieve: jest.fn() },
    },
  }));
}

function mockOrders() {
  const updateRisk = jest.fn();
  const markRefunded = jest.fn();
  jest.doMock("../orders", () => ({
    __esModule: true,
    addOrder: jest.fn(),
    updateRisk,
    markRefunded,
  }));
  return { updateRisk, markRefunded };
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("extractSessionIdFromCharge", () => {
  it("returns invoice from charge.invoice", async () => {
    mockStripe();
    mockOrders();
    const { extractSessionIdFromCharge } = await import("../stripe-webhook");
    const charge = { id: "ch_1", invoice: "in_123" } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("in_123");
  });

  it("returns invoice from payment_intent.latest_charge", async () => {
    mockStripe();
    mockOrders();
    const { extractSessionIdFromCharge } = await import("../stripe-webhook");
    const charge = {
      id: "ch_2",
      payment_intent: { latest_charge: { invoice: "in_456" } },
    } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("in_456");
  });
});

describe("handleStripeWebhook", () => {
  it("updates risk for review.closed charge object", async () => {
    mockStripe();
    const { updateRisk } = mockOrders();
    const { handleStripeWebhook } = await import("../stripe-webhook");
    const event = {
      type: "review.closed",
      data: {
        object: {
          charge: {
            id: "ch_review",
            outcome: { risk_level: "elevated", risk_score: 42 },
          },
        },
      },
    } as any;
    await handleStripeWebhook("shop1", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "shop1",
      "ch_review",
      "elevated",
      42,
      false,
    );
  });

  it("flags and refunds high-risk early fraud warning", async () => {
    mockStripe();
    const { updateRisk, markRefunded } = mockOrders();
    const { handleStripeWebhook } = await import("../stripe-webhook");
    const event = {
      type: "radar.early_fraud_warning.created",
      data: {
        object: {
          charge: {
            id: "ch_warn",
            outcome: { risk_level: "highest", risk_score: 90 },
          },
        },
      },
    } as any;
    await handleStripeWebhook("shop1", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "shop1",
      "ch_warn",
      "highest",
      90,
      true,
    );
    expect(markRefunded).toHaveBeenCalledWith("shop1", "ch_warn");
  });
});

