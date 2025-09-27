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

describe("handleStripeWebhook radar.early_fraud_warning.created", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ["string ref", "ch_high"],
    [
      "object ref",
      { id: "ch_high", outcome: { risk_level: "highest", risk_score: 90 } },
    ],
  ])("refunds when highest risk and charge is %s", (_label, chargeRef) => {
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
        true,
      );
      expect(markRefunded).toHaveBeenCalledWith("test", "ch_high");
    });
  });

  describe.each([
    ["string ref", "ch_low"],
    [
      "object ref",
      { id: "ch_low", outcome: { risk_level: "elevated", risk_score: 30 } },
    ],
  ])("logs low risk without refund when charge is %s", (_label, chargeRef) => {
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
        true,
      );
      expect(markRefunded).not.toHaveBeenCalled();
    });
  });

  test("refunds when risk_score high without risk_level", async () => {
    const { handleStripeWebhook } = await import("../src/stripe-webhook");
    const event: Stripe.Event = {
      type: "radar.early_fraud_warning.created",
      data: {
        object: { charge: { id: "ch_score", outcome: { risk_score: 80 } } },
      },
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
});

