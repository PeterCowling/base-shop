import { jest } from "@jest/globals";
import type { RentalOrder } from "@acme/types";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

type SessionSubset = Pick<
  Stripe.Checkout.Session,
  "metadata" | "payment_intent"
>;
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/return", () => {
  test("refunds remaining deposit after computing damage", async () => {
    const retrieve = jest.fn<Promise<SessionSubset>, []>().mockResolvedValue({
      metadata: { depositTotal: "50" },
      payment_intent: "pi_1",
    } as SessionSubset);
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 20);

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
      markReturned: jest
        .fn<Promise<RentalOrder | null>, []>()
        .mockResolvedValue({} as RentalOrder),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee,
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess", damage: "scratch" }),
    } as unknown as NextRequest);
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50);
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 30 * 100,
    });
    expect(await res.json()).toEqual({ ok: true });
  });

  test("returns ok false when deposit missing", async () => {
    const retrieve = jest
      .fn<Promise<SessionSubset>, []>()
      .mockResolvedValue({ metadata: {} } as SessionSubset);
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
      markReturned: jest
        .fn<Promise<RentalOrder | null>, []>()
        .mockResolvedValue({} as RentalOrder),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee: jest.fn(),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as unknown as NextRequest);
    expect(refundCreate).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({
      ok: false,
      message: "No deposit found",
    });
  });
});
