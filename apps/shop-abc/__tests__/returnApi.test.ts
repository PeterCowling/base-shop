// Jest globals are available automatically – no import needed
import type Stripe from "stripe";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/return", () => {
  test("refunds deposit minus damage fee", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: { depositTotal: "50" },
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn<
      Promise<unknown>,
      [Stripe.RefundCreateParams]
    >();

    jest.doMock(
      "@/lib/stripeServer",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: refundCreate },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest
        .fn<Promise<unknown>, [string, string, number?]>()
        .mockResolvedValue({}),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess", damageFee: 20 }),
    } as any);

    expect(retrieve).toHaveBeenCalledWith("sess", {
      expand: ["payment_intent"],
    });
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 30 * 100,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("returns message when no deposit found", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: {},
        payment_intent: null,
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn<
      Promise<unknown>,
      [Stripe.RefundCreateParams]
    >();

    jest.doMock(
      "@/lib/stripeServer",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: refundCreate },
        },
      }),
      { virtual: true }
    );

    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);

    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: false,
      message: "No deposit found",
    });
  });

  test("returns 400 for missing sessionId", async () => {
    const { POST } = await import("../src/app/api/return/route");
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid request body", async () => {
    const { POST } = await import("../src/app/api/return/route");
    await expect(POST({ json: async () => null } as any)).rejects.toThrow();
  });
});
