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

describe("handleStripeWebhook payment_intent.*", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("payment_intent.succeeded persists risk from latest charge", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          latest_charge: {
            id: "ch_pi",
            outcome: { risk_level: "normal", risk_score: 15 },
          },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith("test", "ch_pi", "normal", 15);
  });

  test("payment_intent.payment_failed marks needs attention", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_fail",
          latest_charge: { id: "ch_fail", invoice: "cs_fail" },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(markNeedsAttention).toHaveBeenCalledWith("test", "cs_fail");
  });
});

