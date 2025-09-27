import { jest } from "@jest/globals";
import type Stripe from "stripe";

const addOrder = jest.fn();
const markRefunded = jest.fn();
const updateRisk = jest.fn();
const markNeedsAttention = jest.fn();
const reviewsCreate = jest.fn();
const piUpdate = jest.fn();
const chargesRetrieve = jest.fn<Promise<any>, [string]>();
const getShopSettings = jest.fn<Promise<any>, [string]>();
const updateSubscriptionPaymentStatus = jest.fn();
const syncSubscriptionData = jest.fn();

jest.mock("../src/orders/creation", () => ({ addOrder }));
jest.mock("../src/orders/refunds", () => ({ markRefunded }));
jest.mock("../src/orders/risk", () => ({ updateRisk, markNeedsAttention }));
jest.mock("../src/repositories/settings.server", () => ({
  getShopSettings,
}));
jest.mock("../src/repositories/subscriptions.server", () => ({
  updateSubscriptionPaymentStatus,
  syncSubscriptionData,
}));
jest.mock("@acme/stripe", () => ({
  stripe: {
    reviews: { create: reviewsCreate },
    paymentIntents: { update: piUpdate },
    charges: { retrieve: chargesRetrieve },
  },
}));

describe("handleStripeWebhook checkout.session.completed", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("triggers manual review and 3DS above threshold", async () => {
    getShopSettings.mockResolvedValue({
      luxuryFeatures: {
        fraudReviewThreshold: 100,
        requireStrongCustomerAuth: true,
      },
    } as any);
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          payment_intent: "pi_1",
          metadata: { depositTotal: "150" },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(addOrder).toHaveBeenCalledWith(
      "test",
      "cs_1",
      150,
      undefined,
      undefined,
    );
    expect(reviewsCreate).toHaveBeenCalledWith({ payment_intent: "pi_1" });
    expect(piUpdate).toHaveBeenCalledWith("pi_1", {
      payment_method_options: { card: { request_three_d_secure: "any" } },
    });
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "cs_1",
      undefined,
      undefined,
      true,
    );
  });

  test("below threshold skips review and 3DS", async () => {
    getShopSettings.mockResolvedValue({
      luxuryFeatures: {
        fraudReviewThreshold: 100,
        requireStrongCustomerAuth: true,
      },
    } as any);
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          payment_intent: "pi_2",
          metadata: { depositTotal: "50" },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(addOrder).toHaveBeenCalledWith(
      "test",
      "cs_2",
      50,
      undefined,
      undefined,
    );
    expect(reviewsCreate).not.toHaveBeenCalled();
    expect(piUpdate).not.toHaveBeenCalled();
    expect(updateRisk).not.toHaveBeenCalled();
  });
});

