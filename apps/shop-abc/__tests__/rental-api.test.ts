import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
if (typeof (Response as any).json !== "function") {
  // polyfill Response.json used by NextResponse
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/rental", () => {
  test("POST creates order with deposit and return date", async () => {
    const retrieve = jest.fn().mockResolvedValue({
      metadata: { depositTotal: "50", returnDate: "2030-01-02" },
    });
    const addOrder = jest.fn();

    jest.doMock(
      "@/lib/stripeServer",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders", () => ({
      __esModule: true,
      addOrder,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
    }));

    const { POST } = await import("../src/app/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(addOrder).toHaveBeenCalledWith("abc", "sess", 50, "2030-01-02");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("PATCH marks order returned and refunds when needed", async () => {
    const markReturned = jest.fn().mockResolvedValue({ deposit: 100 });
    const retrieve = jest.fn().mockResolvedValue({ payment_intent: "pi_1" });
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
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));

    const { PATCH } = await import("../src/app/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "sess", damageFee: 30 }),
    } as any);
    expect(markReturned).toHaveBeenCalledWith("abc", "sess", 30);
    expect(retrieve).toHaveBeenCalledWith("sess", {
      expand: ["payment_intent"],
    });
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 70 * 100,
    });
    expect(res.status).toBe(200);
  });

  test("PATCH returns 404 when order missing", async () => {
    const markReturned = jest.fn().mockResolvedValue(null);

    jest.doMock("@platform-core/repositories/rentalOrders", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));
    jest.doMock(
      "@/lib/stripeServer",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve: jest.fn() } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );

    const { PATCH } = await import("../src/app/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "missing" }),
    } as any);
    expect(markReturned).toHaveBeenCalledWith("abc", "missing", undefined);
    expect(res.status).toBe(404);
  });

  test("no refund issued when refund amount is zero", async () => {
    const markReturned = jest.fn().mockResolvedValue({ deposit: 20 });
    const retrieve = jest.fn().mockResolvedValue({ payment_intent: "pi" });
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
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));

    const { PATCH } = await import("../src/app/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "sess", damageFee: 25 }),
    } as any);
    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
