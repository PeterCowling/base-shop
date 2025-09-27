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

describe("handleStripeWebhook review.closed", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("handles string charge id", async () => {
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
      false,
    );
  });

  test("handles charge object with id", async () => {
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
      false,
    );
  });

  test("clears flag and updates risk from outcome", async () => {
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
      false,
    );
  });

  test("handles missing charge gracefully", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.closed",
      data: { object: { charge: null } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).not.toHaveBeenCalled();
  });
});

