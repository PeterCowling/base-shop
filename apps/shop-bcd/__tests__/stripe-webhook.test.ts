import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";


afterEach(() => jest.resetModules());

describe("/api/stripe-webhook", () => {
  test("verifies signature and forwards events", async () => {
    const handleStripeWebhook = jest.fn();
    jest.doMock(
      "@platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    const payload = {
      type: "checkout.session.completed",
      data: { object: {} },
    } as any;
    const constructEvent = jest.fn().mockReturnValue(payload);
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const res = await POST({
      text: async () => body,
      headers: new Headers({ "stripe-signature": "sig" }),
    } as any);
    expect(constructEvent).toHaveBeenCalledWith(
      body,
      "sig",
      "whsec_test"
    );
    expect(handleStripeWebhook).toHaveBeenCalledWith("bcd", payload);
    expect(res.status).toBe(200);
  });

  test("returns 400 for invalid signature", async () => {
    const handleStripeWebhook = jest.fn();
    jest.doMock(
      "@platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    const constructEvent = jest.fn(() => {
      throw new Error("bad");
    });
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const res = await POST({
      text: async () => "{}",
      headers: new Headers({ "stripe-signature": "sig" }),
    } as any);
    expect(res.status).toBe(400);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
  });

  test("returns 400 when signature header is missing", async () => {
    const handleStripeWebhook = jest.fn();
    jest.doMock(
      "@platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    const constructEvent = jest.fn((_: string, sig: string) => {
      if (!sig) {
        throw new Error("missing signature");
      }
    });
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const res = await POST({
      text: async () => "{}",
      headers: new Headers(),
    } as any);
    expect(res.status).toBe(400);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
  });
});
