import type Stripe from "stripe";
import { asNextJson } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


afterEach(() => {
  jest.resetModules();
});

describe("payment failure handling", () => {
  test("POST /api/return responds with error when refund fails", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: { depositTotal: "50" },
        payment_intent: { id: "pi_123" },
      } as unknown as Stripe.Checkout.Session);
    const refundCreate = jest.fn().mockRejectedValue(new Error("fail"));
    const markReturned = jest.fn();
    const markRefunded = jest.fn();
    const readOrders = jest
      .fn()
      .mockResolvedValue([{ sessionId: "sess", deposit: 50 }]);
    const computeDamageFee = jest.fn().mockResolvedValue(0);
    const readShop = jest.fn().mockResolvedValue({ coverageIncluded: true });

    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: refundCreate },
        },
      }),
      { virtual: true },
    );
    jest.doMock("@acme/platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned,
      markRefunded,
      readOrders,
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
      priceForDays: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop,
    }));

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { POST } = await import("../src/api/return/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));

    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 50 * 100,
    });
    expect(markReturned).not.toHaveBeenCalled();
    expect(markRefunded).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: "Payment processing failed",
    });

    consoleError.mockRestore();
  });

  test("PATCH /api/rental responds with error when additional charge fails", async () => {
    const retrieve = jest
      .fn<Promise<Stripe.Checkout.Session>, [string, { expand: string[] }]>()
      .mockResolvedValue({
        metadata: {},
        payment_intent: { id: "pi_123" },
        currency: "usd",
      } as unknown as Stripe.Checkout.Session);
    const refundsCreate = jest.fn();
    const paymentIntentsCreate = jest
      .fn<Promise<unknown>, [Stripe.PaymentIntentCreateParams]>()
      .mockRejectedValue(new Error("fail"));
    const readOrders = jest
      .fn()
      .mockResolvedValue([{ sessionId: "sess", deposit: 10 }]);
    const markReturned = jest.fn();
    const computeDamageFee = jest.fn().mockResolvedValue(20);
    const readShop = jest.fn().mockResolvedValue({ coverageIncluded: true });

    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: refundsCreate },
          paymentIntents: { create: paymentIntentsCreate },
        },
      }),
      { virtual: true },
    );
    jest.doMock("@acme/platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned,
      readOrders,
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({
      __esModule: true,
      computeDamageFee,
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop,
    }));

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "scratch" }));

    expect(paymentIntentsCreate).toHaveBeenCalled();
    expect(markReturned).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      error: "Payment processing failed",
    });

    consoleError.mockRestore();
  });
});
