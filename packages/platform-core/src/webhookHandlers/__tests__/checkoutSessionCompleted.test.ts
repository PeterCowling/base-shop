import type Stripe from "stripe";

describe("webhookHandlers/checkoutSessionCompleted", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("adds order and triggers review + SCA + risk when deposit exceeds threshold", async () => {
    const addOrder = jest.fn().mockResolvedValue(undefined);
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    const getShopSettings = jest.fn().mockResolvedValue({
      luxuryFeatures: { fraudReviewThreshold: 50, requireStrongCustomerAuth: true },
    });
    const create = jest.fn().mockResolvedValue({});
    const update = jest.fn().mockResolvedValue({});
    jest.doMock("../../orders/creation", () => ({ addOrder }));
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    jest.doMock("../../repositories/settings.server", () => ({ getShopSettings }));
    jest.doMock("@acme/stripe", () => ({
      stripe: { reviews: { create }, paymentIntents: { update } },
    }));

    const handler = (require("../checkoutSessionCompleted").default) as typeof import("../checkoutSessionCompleted").default;

    const session = {
      id: "cs_1",
      metadata: {
        depositTotal: "100",
        returnDate: "2025-01-02",
        internal_customer_id: "cust_1",
        order_id: "ord_1",
      },
      payment_intent: "pi_123",
    } as unknown as Stripe.Checkout.Session;
    const event = { data: { object: session } } as unknown as Stripe.Event;

    await handler("shop1", event);

    expect(addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "shop1",
        orderId: "ord_1",
        sessionId: "cs_1",
        deposit: 100,
        expectedReturnDate: "2025-01-02",
        customerId: "cust_1",
        stripePaymentIntentId: "pi_123",
      }),
    );
    expect(create).toHaveBeenCalledWith({ payment_intent: "pi_123" });
    expect(update).toHaveBeenCalledWith("pi_123", {
      payment_method_options: { card: { request_three_d_secure: "any" } },
    });
    expect(updateRisk).toHaveBeenCalledWith("shop1", "cs_1", undefined, undefined, true);
  });

  test("adds order only when deposit below threshold", async () => {
    const addOrder = jest.fn().mockResolvedValue(undefined);
    const updateRisk = jest.fn().mockResolvedValue(undefined);
    const getShopSettings = jest.fn().mockResolvedValue({
      luxuryFeatures: { fraudReviewThreshold: 200, requireStrongCustomerAuth: false },
    });
    const create = jest.fn();
    const update = jest.fn();
    jest.doMock("../../orders/creation", () => ({ addOrder }));
    jest.doMock("../../orders/risk", () => ({ updateRisk }));
    jest.doMock("../../repositories/settings.server", () => ({ getShopSettings }));
    jest.doMock("@acme/stripe", () => ({
      stripe: { reviews: { create }, paymentIntents: { update } },
    }));

    const handler = (require("../checkoutSessionCompleted").default) as typeof import("../checkoutSessionCompleted").default;
    const session = {
      id: "cs_2",
      metadata: { depositTotal: "25" },
      payment_intent: "pi_456",
    } as unknown as Stripe.Checkout.Session;
    const event = { data: { object: session } } as unknown as Stripe.Event;

    await handler("shop2", event);

    expect(addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "shop2",
        sessionId: "cs_2",
        deposit: 25,
        stripePaymentIntentId: "pi_456",
      }),
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(updateRisk).not.toHaveBeenCalled();
  });
});
