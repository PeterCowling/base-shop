import type Stripe from "stripe";
import { asNextJson } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

afterEach(() => {
  jest.resetModules();
});

describe("/api/rental", () => {
  test("POST adds order and returns ok", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string]>()
      .mockResolvedValue({
        metadata: { depositTotal: "25", returnDate: "2024-01-01" },
      } as unknown as Stripe.Checkout.Session);
    const addOrder = jest.fn();

    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder,
      markReturned: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn(),
    }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));

    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 25, "2024-01-01");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("PATCH returns 404 when order missing", async () => {
    const markReturned = jest.fn().mockResolvedValue(null);

    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        refunds: { create: jest.fn() },
      },
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned,
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn(),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess" }));

    expect(markReturned).toHaveBeenCalledWith("bcd", "sess");
    expect(res.status).toBe(404);
  });

  test("PATCH refunds deposit minus damage fee", async () => {
    const markReturned = jest
      .fn()
      .mockResolvedValueOnce({ deposit: 50 })
      .mockResolvedValue({});
    const readShop = jest.fn().mockResolvedValue({ coverageIncluded: true });
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: {},
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const computeDamageFee = jest.fn().mockResolvedValue(20);
    const refundCreate = jest.fn();

    jest.doMock(
      "@acme/stripe",
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
      addOrder: jest.fn(),
      markReturned,
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop,
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "scratch" }));

    expect(markReturned).toHaveBeenNthCalledWith(1, "bcd", "sess");
    expect(readShop).toHaveBeenCalledWith("bcd");
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50, ["scratch"], true);
    expect(markReturned).toHaveBeenNthCalledWith(2, "bcd", "sess", 20);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 30 * 100,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
