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

describe("handleStripeWebhook charge.succeeded", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("persists risk details and stores reconciliation ids", async () => {
    const { prisma } = await import("../src/db");
    await prisma.rentalOrder.create({
      data: {
        id: "o1",
        shop: "test",
        sessionId: "cs_1",
        deposit: 0,
        startedAt: "2025-01-01T00:00:00Z",
        stripePaymentIntentId: "pi_1",
      },
    });

    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      id: "evt_1",
      type: "charge.succeeded",
      data: {
        object: {
          id: "ch_1",
          payment_intent: "pi_1",
          balance_transaction: "bt_1",
          customer: "cus_1",
          outcome: { risk_level: "elevated", risk_score: 42 },
        },
      },
    } as any;
    await handleStripeWebhook("test", event);
    expect(updateRisk).toHaveBeenCalledWith("test", "ch_1", "elevated", 42);

    const updated = await prisma.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "test", sessionId: "cs_1" } },
    });
    expect(updated).toEqual(
      expect.objectContaining({
        stripeChargeId: "ch_1",
        stripeBalanceTransactionId: "bt_1",
        stripeCustomerId: "cus_1",
      }),
    );
  });
});
