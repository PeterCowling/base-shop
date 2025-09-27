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

describe("handleStripeWebhook invoice.*", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
});

