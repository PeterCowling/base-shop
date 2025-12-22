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
const wasStripeWebhookEventProcessed = jest.fn<Promise<boolean>, [string]>();
const markStripeWebhookEventProcessed = jest.fn<Promise<void>, [string, any]>();
const markStripeWebhookEventFailed = jest.fn<Promise<void>, [string, any, any]>();

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
jest.mock("../src/stripeWebhookEventStore", () => ({
  wasStripeWebhookEventProcessed,
  markStripeWebhookEventProcessed,
  markStripeWebhookEventFailed,
}));

describe("handleStripeWebhook checkout.session.completed", () => {
  afterEach(() => {
    jest.clearAllMocks();
    wasStripeWebhookEventProcessed.mockReset();
    markStripeWebhookEventProcessed.mockReset();
    markStripeWebhookEventFailed.mockReset();
  });

  test("triggers manual review and 3DS above threshold", async () => {
    wasStripeWebhookEventProcessed.mockResolvedValue(false);
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
      expect.objectContaining({
        shop: "test",
        sessionId: "cs_1",
        deposit: 150,
        stripePaymentIntentId: "pi_1",
      }),
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
    wasStripeWebhookEventProcessed.mockResolvedValue(false);
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
      expect.objectContaining({
        shop: "test",
        sessionId: "cs_2",
        deposit: 50,
        stripePaymentIntentId: "pi_2",
      }),
    );
    expect(reviewsCreate).not.toHaveBeenCalled();
    expect(piUpdate).not.toHaveBeenCalled();
    expect(updateRisk).not.toHaveBeenCalled();
  });

  test("short-circuits already-processed events and does not re-create orders", async () => {
    wasStripeWebhookEventProcessed.mockResolvedValue(true);
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_dup",
          payment_intent: "pi_dup",
          metadata: { depositTotal: "10" },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);

    expect(addOrder).not.toHaveBeenCalled();
    expect(markStripeWebhookEventProcessed).not.toHaveBeenCalled();
    expect(markStripeWebhookEventFailed).not.toHaveBeenCalled();
  });
});
