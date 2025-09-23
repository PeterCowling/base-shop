import type Stripe from "stripe";

describe("webhookHandlers/invoicePaymentSucceeded", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("updates subscription status to succeeded when ids present", async () => {
    const updateSubscriptionPaymentStatus = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ updateSubscriptionPaymentStatus }));

    const handler = (require("../invoicePaymentSucceeded").default) as typeof import("../invoicePaymentSucceeded").default;
    const invoice = {
      customer: { id: "cus_123" },
      subscription: { id: "sub_456" },
    } as unknown as Stripe.Invoice;
    const event = { data: { object: invoice } } as unknown as Stripe.Event;

    await handler("shop1", event);
    expect(updateSubscriptionPaymentStatus).toHaveBeenCalledWith("cus_123", "sub_456", "succeeded");
  });

  test("does nothing when missing identifiers", async () => {
    const updateSubscriptionPaymentStatus = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ updateSubscriptionPaymentStatus }));
    const handler = (require("../invoicePaymentSucceeded").default) as typeof import("../invoicePaymentSucceeded").default;
    // Missing subscription
    const invoice = { customer: "cus_123", subscription: null } as unknown as Stripe.Invoice;
    const event = { data: { object: invoice } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(updateSubscriptionPaymentStatus).not.toHaveBeenCalled();
  });
});

