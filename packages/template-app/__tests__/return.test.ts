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

    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest
        .fn()
        .mockResolvedValue({ returnsEnabled: true, coverageIncluded: true }),
    }));
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
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 50, [], true);
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

    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest
        .fn()
        .mockResolvedValue({ returnsEnabled: true, coverageIncluded: true }),
    }));
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

  test("returns 403 when returns disabled", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: false }),
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as unknown as NextRequest);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Returns disabled" });
  });

  test("returns 404 when order not found", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: true }),
    }));
    const markReturned = jest
      .fn<Promise<RentalOrder | null>, []>()
      .mockResolvedValue(null);
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
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as unknown as NextRequest);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Order not found" });
  });

  test("home pickup disabled when setting false", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: true }),
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["12345"] }),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: false } }),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ zip: "12345", date: "2023-01-01", time: "10:00" }),
    } as unknown as NextRequest);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Home pickup disabled" });
  });

  test("rejects ZIP not eligible for pickup", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: true }),
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["99999"] }),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: true } }),
    }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({
      json: async () => ({ zip: "12345", date: "2023-01-01", time: "10:00" }),
    } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "ZIP not eligible" });
  });

  test("schedules valid home pickup", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: true }),
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));
    jest.doMock("@platform-core/returnLogistics", () => ({
      __esModule: true,
      getReturnBagAndLabel: jest
        .fn()
        .mockResolvedValue({ homePickupZipCodes: ["12345"] }),
    }));
    jest.doMock("@platform-core/repositories/settings.server", () => ({
      __esModule: true,
      getShopSettings: jest
        .fn()
        .mockResolvedValue({ returnService: { homePickupEnabled: true } }),
    }));

    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const fetchMock = jest
      .fn()
      .mockResolvedValue({} as Response);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = fetchMock;

    const { POST } = await import("../src/api/return/route");
    const appt = { zip: "12345", date: "2023-01-01", time: "10:00" };
    const res = await POST({ json: async () => appt } as unknown as NextRequest);

    expect(log).toHaveBeenCalledWith("pickup scheduled", appt);
    expect(fetchMock).toHaveBeenCalledWith("https://carrier.invalid/pickup", {
      method: "POST",
      body: JSON.stringify(appt),
    });
    expect(await res.json()).toEqual({ ok: true });
    log.mockRestore();
  });

  test("returns 400 for invalid request", async () => {
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn().mockResolvedValue({ returnsEnabled: true }),
    }));
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      markReturned: jest.fn(),
      markRefunded: jest.fn(),
      addOrder: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { checkout: { sessions: { retrieve: jest.fn() } }, refunds: { create: jest.fn() } },
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/return/route");
    const res = await POST({ json: async () => ({}) } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request" });
  });
});
