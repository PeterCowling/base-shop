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
  const markNeedsAttention = jest.fn();
  jest.doMock("../orders/creation", () => ({
    __esModule: true,
    addOrder: jest.fn(),
    listOrders: jest.fn(),
    readOrders: jest.fn(),
    getOrdersForCustomer: jest.fn(),
  }));
  jest.doMock("../orders/refunds", () => ({
    __esModule: true,
    markRefunded,
    refundOrder: jest.fn(),
  }));
  jest.doMock("../orders/risk", () => ({
    __esModule: true,
    updateRisk,
    markNeedsAttention,
  }));
  return { updateRisk, markRefunded, markNeedsAttention };
}

function mockSubscriptions() {
  const updateSubscriptionPaymentStatus = jest.fn();
  const syncSubscriptionData = jest.fn();
  jest.doMock("../repositories/subscriptions.server", () => ({
    __esModule: true,
    updateSubscriptionPaymentStatus,
    syncSubscriptionData,
  }));
  return { updateSubscriptionPaymentStatus, syncSubscriptionData };
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe("extractSessionIdFromCharge", () => {
  it("returns invoice from charge.invoice", async () => {
    mockStripe();
    mockOrders();
    mockSubscriptions();
    const { extractSessionIdFromCharge } = await import(
      "../internal/helpers/risk"
    );
    const charge = { id: "ch_1", invoice: "in_123" } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("in_123");
  });

  it("returns invoice from payment_intent.latest_charge", async () => {
    mockStripe();
    mockOrders();
    mockSubscriptions();
    const { extractSessionIdFromCharge } = await import(
      "../internal/helpers/risk"
    );
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
    mockSubscriptions();
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
    mockSubscriptions();
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

  it("marks order needing attention on payment failure", async () => {
    mockStripe();
    const { markNeedsAttention } = mockOrders();
    mockSubscriptions();
    const { handleStripeWebhook } = await import("../stripe-webhook");
    const event = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_1",
          latest_charge: { id: "ch_1", invoice: "in_1" },
        },
      },
    } as any;
    await handleStripeWebhook("shop1", event);
    expect(markNeedsAttention).toHaveBeenCalledWith("shop1", "in_1");
  });

  it("updates subscription payment status on invoice events", async () => {
    mockStripe();
    mockOrders();
    const { updateSubscriptionPaymentStatus } = mockSubscriptions();
    const { handleStripeWebhook } = await import("../stripe-webhook");
    const invoice = { customer: "cus_1", subscription: "sub_1" } as any;
    await handleStripeWebhook("shop1", {
      type: "invoice.payment_succeeded",
      data: { object: invoice },
    } as any);
    expect(updateSubscriptionPaymentStatus).toHaveBeenCalledWith(
      "cus_1",
      "sub_1",
      "succeeded",
    );

    await handleStripeWebhook("shop1", {
      type: "invoice.payment_failed",
      data: { object: invoice },
    } as any);
    expect(updateSubscriptionPaymentStatus).toHaveBeenCalledWith(
      "cus_1",
      "sub_1",
      "failed",
    );
  });

  it("syncs subscription data on update and delete", async () => {
    mockStripe();
    mockOrders();
    const { syncSubscriptionData } = mockSubscriptions();
    const { handleStripeWebhook } = await import("../stripe-webhook");
    const subscription = { id: "sub_1", customer: "cus_1" } as any;
    await handleStripeWebhook("shop1", {
      type: "customer.subscription.updated",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_1", "sub_1");

    await handleStripeWebhook("shop1", {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_1", null);
  });
});
