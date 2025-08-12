import { jest } from "@jest/globals";
import type Stripe from "stripe";

const addOrder = jest.fn();
const markRefunded = jest.fn();
const updateRisk = jest.fn();

jest.mock("../src/orders", () => ({
  addOrder,
  markRefunded,
  updateRisk,
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
});
