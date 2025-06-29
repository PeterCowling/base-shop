import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/return", () => {
  test("refunds remaining deposit after computing damage", async () => {
    const retrieve = jest.fn().mockResolvedValue({
      metadata: { depositTotal: "50" },
      payment_intent: "pi_1",
    });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 20);

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
    jest.doMock("@platform-core/repositories/rentalOrders", () => ({
      __esModule: true,
      markReturned: jest.fn().mockResolvedValue({}),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee,
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess", damage: "scratch" }),
    } as any);
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 30 * 100,
    });
    expect(await res.json()).toEqual({ ok: true });
  });

  test("returns ok false when deposit missing", async () => {
    const retrieve = jest.fn().mockResolvedValue({ metadata: {} });
    const refundCreate = jest.fn();

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
    jest.doMock("@platform-core/repositories/rentalOrders", () => ({
      __esModule: true,
      markReturned: jest.fn().mockResolvedValue({}),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(refundCreate).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({
      ok: false,
      message: "No deposit found",
    });
  });
});
