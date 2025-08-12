import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/stripe-webhook", () => {
  test("forwards events to common handler", async () => {
    const handleStripeWebhook = jest.fn();
    jest.doMock("@platform-core/stripe-webhook", () => ({
      __esModule: true,
      handleStripeWebhook,
    }), { virtual: true });

    const { POST } = await import("../src/api/stripe-webhook/route");
    const payload = { type: "checkout.session.completed", data: { object: {} } } as any;
    const res = await POST({ json: async () => payload } as any);
    expect(handleStripeWebhook).toHaveBeenCalledWith("bcd", payload);
    expect(res.status).toBe(200);
  });
});
