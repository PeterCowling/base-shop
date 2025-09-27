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

describe("handleStripeWebhook subscription events", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("syncs data on update and delete", async () => {
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

  test("deletion extracts customer id from object", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const subscription: any = { id: "sub_obj", customer: { id: "cus_obj" } };
    await handleStripeWebhook("test", {
      type: "customer.subscription.deleted",
      data: { object: subscription },
    } as any);
    expect(syncSubscriptionData).toHaveBeenLastCalledWith("cus_obj", null);
  });
});

