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

describe("handleStripeWebhook review.opened", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("flags order when charge provided", async () => {
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
      true,
    );
  });

  test("handles missing charge gracefully", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "review.opened",
      data: { object: { charge: null } },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).not.toHaveBeenCalled();
  });
});

