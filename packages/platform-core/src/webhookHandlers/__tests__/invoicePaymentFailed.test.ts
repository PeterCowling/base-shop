import type Stripe from "stripe";

describe("webhookHandlers/invoicePaymentFailed", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("updates subscription status to failed when ids present", async () => {
    const updateSubscriptionPaymentStatus = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ updateSubscriptionPaymentStatus }));

    const handler = (require("../invoicePaymentFailed").default) as typeof import("../invoicePaymentFailed").default;
    const invoice = {
      customer: "cus_A",
      subscription: { id: "sub_B" },
    } as unknown as Stripe.Invoice;
    const event = { data: { object: invoice } } as unknown as Stripe.Event;

    await handler("shop1", event);
    expect(updateSubscriptionPaymentStatus).toHaveBeenCalledWith("cus_A", "sub_B", "failed");
  });

  test("no-op when missing identifiers", async () => {
    const updateSubscriptionPaymentStatus = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../../repositories/subscriptions.server", () => ({ updateSubscriptionPaymentStatus }));
    const handler = (require("../invoicePaymentFailed").default) as typeof import("../invoicePaymentFailed").default;
    const invoice = { customer: null, subscription: null } as unknown as Stripe.Invoice;
    const event = { data: { object: invoice } } as unknown as Stripe.Event;
    await handler("shop1", event);
    expect(updateSubscriptionPaymentStatus).not.toHaveBeenCalled();
  });
});

