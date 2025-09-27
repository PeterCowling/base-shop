import { jest } from "@jest/globals";

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

describe("handleStripeWebhook unhandled events", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("ignores unknown event types", async () => {
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

