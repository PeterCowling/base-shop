import { POST } from "./route";

jest.mock("@acme/config/env/payments", () => ({
  paymentsEnv: {
    STRIPE_WEBHOOK_SECRET: "whsec_test",
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock("@/lib/payments/stripeCheckout.server", () => ({
  finalizeStripeSession: jest.fn(),
  expireStripeSession: jest.fn(),
}));

jest.mock("@acme/platform-core/stripeWebhookEventStore", () => ({
  markStripeWebhookEventProcessed: jest.fn().mockResolvedValue(undefined),
  markStripeWebhookEventFailed: jest.fn().mockResolvedValue(undefined),
}));

const { stripe } = jest.requireMock("@acme/stripe") as {
  stripe: { webhooks: { constructEvent: jest.Mock } };
};

const { finalizeStripeSession, expireStripeSession } = jest.requireMock(
  "@/lib/payments/stripeCheckout.server",
) as {
  finalizeStripeSession: jest.Mock;
  expireStripeSession: jest.Mock;
};

const { markStripeWebhookEventProcessed, markStripeWebhookEventFailed } =
  jest.requireMock("@acme/platform-core/stripeWebhookEventStore") as {
    markStripeWebhookEventProcessed: jest.Mock;
    markStripeWebhookEventFailed: jest.Mock;
  };

describe("POST /api/stripe-webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: finalizeStripeSession and expireStripeSession succeed.
    finalizeStripeSession.mockResolvedValue(undefined);
    expireStripeSession.mockResolvedValue(undefined);
  });

  it("TC-06-14: completed Stripe sessions are finalized", async () => {
    const payload = {
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(payload);

    const body = JSON.stringify(payload);
    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_123" }),
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      body,
      "sig_123",
      "whsec_test",
    );
    expect(finalizeStripeSession).toHaveBeenCalledWith("cs_test_123");
    expect(expireStripeSession).not.toHaveBeenCalled();
  });

  it("TC-06-15: expired Stripe sessions release the hold path", async () => {
    const payload = {
      type: "checkout.session.expired",
      data: { object: { id: "cs_test_expired" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(payload);

    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_123" }),
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(200);
    expect(expireStripeSession).toHaveBeenCalledWith("cs_test_expired");
    expect(finalizeStripeSession).not.toHaveBeenCalled();
  });

  it("TC-06-16: invalid signatures are rejected", async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_123" }),
        body: "{}",
      }),
    );

    expect(res.status).toBe(400);
    expect(finalizeStripeSession).not.toHaveBeenCalled();
    expect(expireStripeSession).not.toHaveBeenCalled();
  });

  // TC-07: Webhook event store wire-up
  it("TC-07-01: successful completed webhook calls markStripeWebhookEventProcessed with shop=caryina", async () => {
    const payload = {
      id: "evt_test_processed",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(payload);

    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_123" }),
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(200);
    expect(markStripeWebhookEventProcessed).toHaveBeenCalledWith("caryina", payload);
  });

  it("TC-07-02: markStripeWebhookEventProcessed throws → webhook handler still returns 200", async () => {
    const payload = {
      id: "evt_test_resilient",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_resilient" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(payload);
    markStripeWebhookEventProcessed.mockRejectedValue(new Error("DB write failed"));

    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_resilient" }),
        body: JSON.stringify(payload),
      }),
    );

    // Store write failure must not block webhook — Stripe retries on 5xx.
    expect(res.status).toBe(200);
    expect(finalizeStripeSession).toHaveBeenCalledWith("cs_test_resilient");
  });

  it("TC-07-03: existing TC-06-14 and TC-06-15 tests still pass (regression guard)", async () => {
    // TC-06-14: completed
    const completedPayload = {
      id: "evt_completed",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_guard" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(completedPayload);
    let res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_guard" }),
        body: JSON.stringify(completedPayload),
      }),
    );
    expect(res.status).toBe(200);
    expect(finalizeStripeSession).toHaveBeenCalledWith("cs_test_guard");

    jest.clearAllMocks();
    finalizeStripeSession.mockResolvedValue(undefined);
    expireStripeSession.mockResolvedValue(undefined);

    // TC-06-15: expired
    const expiredPayload = {
      id: "evt_expired",
      type: "checkout.session.expired",
      data: { object: { id: "cs_test_guard_exp" } },
    };
    stripe.webhooks.constructEvent.mockReturnValue(expiredPayload);
    res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: new Headers({ "stripe-signature": "sig_guard_exp" }),
        body: JSON.stringify(expiredPayload),
      }),
    );
    expect(res.status).toBe(200);
    expect(expireStripeSession).toHaveBeenCalledWith("cs_test_guard_exp");
  });
});
