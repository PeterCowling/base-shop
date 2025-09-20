// apps/shop-bcd/__tests__/return-api.test.ts
import type Stripe from "stripe";
import { asNextJson } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


afterEach(() => jest.resetModules());

describe("/api/return", () => {
  test("refunds deposit minus damage fee", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: { depositTotal: "50" },
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn<Promise<unknown>, [Stripe.RefundCreateParams]>();
    const markReturned = jest
      .fn<Promise<unknown>, [string, string, number?]>()
      .mockResolvedValueOnce({
        riskLevel: "low",
        riskScore: 5,
        flaggedForReview: true,
      })
      .mockResolvedValue({});
    const markRefunded = jest.fn();
    const computeDamageFee = jest.fn().mockResolvedValue(20);

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
      markReturned,
      markRefunded,
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
      priceForDays: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess", damage: "scratch" }));

    expect(retrieve).toHaveBeenCalledWith("sess", { expand: ["payment_intent"] });
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50, [], true);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 30 * 100,
    });
    expect(markReturned).toHaveBeenNthCalledWith(1, "bcd", "sess");
    expect(markReturned).toHaveBeenNthCalledWith(2, "bcd", "sess", 20);
    expect(markRefunded).toHaveBeenCalledWith("bcd", "sess", "low", 5, true);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("returns 500 when markRefunded fails", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: { depositTotal: "50" },
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn<Promise<unknown>, [Stripe.RefundCreateParams]>();
    const markReturned = jest
      .fn<Promise<unknown>, [string, string, number?]>()
      .mockResolvedValue({
        riskLevel: "medium",
        riskScore: 10,
        flaggedForReview: false,
      });
    const markRefunded = jest.fn().mockResolvedValue(null);
    const computeDamageFee = jest.fn().mockResolvedValue(0);

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
      markReturned,
      markRefunded,
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
      priceForDays: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));

    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 50 * 100,
    });
    expect(markRefunded).toHaveBeenCalledWith(
      "bcd",
      "sess",
      "medium",
      10,
      false,
    );
    expect(res.status).toBe(500);
  });

  test("refunds full deposit and forwards risk info when no damage fee", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: { depositTotal: "50" },
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn<Promise<unknown>, [Stripe.RefundCreateParams]>();
    const markReturned = jest
      .fn<Promise<unknown>, [string, string, number?]>()
      .mockResolvedValue({
        riskLevel: "high",
        riskScore: 42,
        flaggedForReview: true,
      });
    const markRefunded = jest.fn();
    const computeDamageFee = jest.fn().mockResolvedValue(0);

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
      markReturned,
      markRefunded,
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
      priceForDays: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));

    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 50 * 100,
    });
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess");
    expect(markRefunded).toHaveBeenCalledWith("bcd", "sess", "high", 42, true);
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
    const refundCreate = jest.fn<Promise<unknown>, [Stripe.RefundCreateParams]>();
    const markReturned = jest
      .fn<Promise<unknown>, [string, string, number?]>()
      .mockResolvedValue({});
    const markRefunded = jest.fn();
    const computeDamageFee = jest.fn().mockResolvedValue(10);

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
      markReturned,
      markRefunded,
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
      priceForDays: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess", damage: 5 }));

    expect(refundCreate).not.toHaveBeenCalled();
    expect(markRefunded).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false, message: "No deposit found" });
  });

  test("returns 404 when order not found", async () => {
    const markReturned = jest
      .fn<Promise<unknown>, [string, string, number?]>()
      .mockResolvedValue(undefined);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned,
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee: jest.fn(),
      priceForDays: jest.fn(),
    }));
    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "missing" }));
    expect(markReturned).toHaveBeenCalledWith("bcd", "missing");
    expect(res.status).toBe(404);
  });

  test("returns 400 for missing sessionId", async () => {
    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({}));
    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid request body", async () => {
    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson(null as any));
    expect(res.status).toBe(400);
  });
});
