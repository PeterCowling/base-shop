import { jest } from "@jest/globals";
import type Stripe from "stripe";

const addOrder = jest.fn();
const markRefunded = jest.fn();
const updateRisk = jest.fn();
const markNeedsAttention = jest.fn();
const reviewsCreate = jest.fn();
const piUpdate = jest.fn();
const chargesRetrieve = jest.fn<Promise<any>, [string]>();
// getShopSettings normally resolves to shop configuration; type it broadly for tests
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

  describe.each([
    ["string ref", "ch_high"],
    ["object ref", { id: "ch_high", outcome: { risk_level: "highest", risk_score: 90 } }],
  ])("early fraud warning cancels high risk when charge is %s", (_label, chargeRef) => {
    test("", async () => {
      const { handleStripeWebhook } = await import("../src/stripe-webhook");
      if (typeof chargeRef === "string") {
        chargesRetrieve.mockResolvedValue({
          outcome: { risk_level: "highest", risk_score: 90 },
        } as any);
      }
      const event: Stripe.Event = {
        type: "radar.early_fraud_warning.created",
        data: { object: { charge: chargeRef } },
      } as any;
      await handleStripeWebhook("test", event);
      expect(updateRisk).toHaveBeenCalledWith(
        "test",
        "ch_high",
        "highest",
        90,
        true
      );
      expect(markRefunded).toHaveBeenCalledWith("test", "ch_high");
    });
  });

  describe.each([
    ["string ref", "ch_low"],
    ["object ref", { id: "ch_low", outcome: { risk_level: "elevated", risk_score: 30 } }],
  ])("early fraud warning logs low risk without refund when charge is %s", (_label, chargeRef) => {
    test("", async () => {
      const { handleStripeWebhook } = await import("../src/stripe-webhook");
      if (typeof chargeRef === "string") {
        chargesRetrieve.mockResolvedValue({
          outcome: { risk_level: "elevated", risk_score: 30 },
        } as any);
      }
      const event: Stripe.Event = {
        type: "radar.early_fraud_warning.created",
        data: { object: { charge: chargeRef } },
      } as any;
      await handleStripeWebhook("test", event);
      expect(updateRisk).toHaveBeenCalledWith(
        "test",
        "ch_low",
        "elevated",
        30,
        true
      );
      expect(markRefunded).not.toHaveBeenCalled();
    });
  });

  test("early fraud warning refunds when risk_score high without risk_level", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "radar.early_fraud_warning.created",
      data: { object: { charge: { id: "ch_score", outcome: { risk_score: 80 } } } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "ch_score",
      undefined,
      80,
      true,
    );
    expect(markRefunded).toHaveBeenCalledWith("test", "ch_score");
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

  test("review.opened handles missing charge", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.opened",
      data: { object: { charge: null } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).not.toHaveBeenCalled();
  });

  test("review.closed handles string charge ID", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.closed",
      data: { object: { charge: "ch_str" } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "ch_str",
      undefined,
      undefined,
      false
    );
  });

  test("review.closed handles charge object with id", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.closed",
      data: { object: { charge: { id: "ch_obj" } } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith(
      "test",
      "ch_obj",
      undefined,
      undefined,
      false
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

  test("review.closed handles missing charge", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.closed",
      data: { object: { charge: null } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).not.toHaveBeenCalled();
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

  test("invoice payment events update subscription status", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const invoice: any = { customer: "cus_1", subscription: "sub_1" };
    await handleStripeWebhook("test", {
      type: "invoice.payment_succeeded",
      data: { object: invoice },
    } as any);
    expect(updateSubscriptionPaymentStatus).toHaveBeenCalledWith(
      "cus_1",
      "sub_1",
      "succeeded",
    );
    await handleStripeWebhook("test", {
      type: "invoice.payment_failed",
      data: { object: invoice },
    } as any);
    expect(updateSubscriptionPaymentStatus).toHaveBeenLastCalledWith(
      "cus_1",
      "sub_1",
      "failed",
    );
  });

  test("subscription events sync data", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const subscription: any = { id: "sub_1", customer: "cus_1" };
    await handleStripeWebhook("test", {
      type: "customer.subscription.updated",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenCalledWith("cus_1", "sub_1");
    await handleStripeWebhook("test", {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenLastCalledWith("cus_1", null);
  });

  test("subscription deletion extracts customer id from object", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const subscription: any = { id: "sub_obj", customer: { id: "cus_obj" } };
    await handleStripeWebhook("test", {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenLastCalledWith("cus_obj", null);
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

  test("unhandled event types are ignored", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    await handleStripeWebhook("test", {
      type: "some.random.event",
      data: { object: {} },
    } as any);
    expect(addOrder).not.toHaveBeenCalled();
    expect(updateRisk).not.toHaveBeenCalled();
    expect(markRefunded).not.toHaveBeenCalled();
    expect(markNeedsAttention).not.toHaveBeenCalled();
  });
});
