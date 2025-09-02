import { jest } from "@jest/globals";
import type Stripe from "stripe";

const addOrder = jest.fn();
const markRefunded = jest.fn();
const updateRisk = jest.fn();
const reviewsCreate = jest.fn();
const piUpdate = jest.fn();
const chargesRetrieve = jest.fn<Promise<any>, [string]>();
// getShopSettings normally resolves to shop configuration; type it broadly for tests
const getShopSettings = jest.fn<Promise<any>, [string]>();

jest.mock("../src/orders", () => ({
  addOrder,
  markRefunded,
  updateRisk,
}));
jest.mock("../src/repositories/settings.server", () => ({
  getShopSettings,
}));
jest.mock("@acme/stripe", () => ({
  stripe: {
    reviews: { create: reviewsCreate },
    paymentIntents: { update: piUpdate },
    charges: { retrieve: chargesRetrieve },
  },
}));

describe("handleStripeWebhook", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("charge.succeeded persists risk details", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "charge.succeeded",
      data: {
        object: {
          id: "ch_1",
          outcome: { risk_level: "elevated", risk_score: 42 },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith("test", "ch_1", "elevated", 42);
  });

  test("early fraud warning cancels high risk", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    chargesRetrieve.mockResolvedValue({
      outcome: { risk_level: "highest", risk_score: 90 },
    } as any);
    const event: Stripe.Event = {
      type: "radar.early_fraud_warning.created",
      data: {
        object: {
          charge: "ch_2",
          risk_level: "highest",
          risk_score: 90,
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith("test", "ch_2", "highest", 90, true);
    expect(markRefunded).toHaveBeenCalledWith("test", "ch_2");
  });

  test("early fraud warning logs low risk without refund", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    chargesRetrieve.mockResolvedValue({
      outcome: { risk_level: "elevated", risk_score: 30 },
    } as any);
    const event: Stripe.Event = {
      type: "radar.early_fraud_warning.created",
      data: { object: { charge: "ch_low" } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith("test", "ch_low", "elevated", 30, true);
    expect(markRefunded).not.toHaveBeenCalled();
  });

  test("review.opened flags order", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.opened",
      data: { object: { charge: "ch_3" } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "ch_3",
      undefined,
      undefined,
      true
    );
  });

  test("review.closed clears flag and updates risk", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.closed",
      data: {
        object: {
          charge: {
            id: "ch_4",
            outcome: { risk_level: "not_assessed", risk_score: 10 },
          },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "ch_4",
      "not_assessed",
      10,
      false
    );
  });

  test("charge.refunded marks order refunded", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "charge.refunded",
      data: { object: { id: "ch_ref", invoice: "cs_ref" } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(markRefunded).toHaveBeenCalledWith("test", "cs_ref");
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

  test("checkout.session.completed triggers manual review and 3DS", async () => {
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
    expect(addOrder).toHaveBeenCalledWith("test", "cs_1", 150, undefined, undefined);
    expect(reviewsCreate).toHaveBeenCalledWith({ payment_intent: "pi_1" });
    expect(piUpdate).toHaveBeenCalledWith("pi_1", {
      payment_method_options: { card: { request_three_d_secure: "any" } },
    });
    expect(updateRisk).toHaveBeenCalledWith("test", "cs_1", undefined, undefined, true);
  });

  test("checkout.session.completed below threshold skips review", async () => {
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
    expect(addOrder).toHaveBeenCalledWith("test", "cs_2", 50, undefined, undefined);
    expect(reviewsCreate).not.toHaveBeenCalled();
    expect(piUpdate).not.toHaveBeenCalled();
    expect(updateRisk).not.toHaveBeenCalled();
  });
});
