import { jest } from "@jest/globals";
import { mockStripe, mockRentalRepo } from "./helpers/rental";
import { asNextJson } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


afterEach(() => jest.resetModules());

describe("/api/rental PATCH", () => {
  test("returns 400 when sessionId is missing", async () => {
    mockStripe();
    mockRentalRepo();
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn(),
    }));
    jest.doMock("@platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: jest.fn(),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({}));
    expect(res.status).toBe(400);
  });

  test("marks order returned and refunds when needed", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string, string?]>()
      .mockResolvedValue({ deposit: 100 });
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi_1" });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 30);
    mockStripe({
      checkout: { sessions: { retrieve } },
      refunds: { create: refundCreate },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: undefined }),
      },
    });
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "scratch" }));
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess");
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess", 30);
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 100, [], true);
    expect(retrieve).toHaveBeenCalledWith("sess", { expand: ["payment_intent"] });
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 70 * 100,
    });
    expect(res.status).toBe(200);
  });

  test("creates payment intent when damage exceeds deposit", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string]>()
      .mockResolvedValue({ deposit: 100 });
    const retrieve = jest
      .fn<
        Promise<{ payment_intent: string; currency: string; customer: string }>,
        [string, any]
      >()
      .mockResolvedValue({
        payment_intent: "pi_1",
        currency: "usd",
        customer: "cus_123",
      });
    const paymentIntentsCreate = jest
      .fn<Promise<{ client_secret: string }>, [any]>()
      .mockResolvedValue({ client_secret: "cs_123" });
    const computeDamageFee = jest.fn(async () => 150);
    mockStripe({
      checkout: { sessions: { retrieve } },
      refunds: { create: jest.fn() },
      paymentIntents: { create: paymentIntentsCreate },
    });
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "major" }));
    expect(paymentIntentsCreate).toHaveBeenCalledWith({
      amount: 50 * 100,
      currency: "usd",
      customer: "cus_123",
      metadata: { sessionId: "sess", purpose: "damage_fee" },
    });
    expect(await res.json()).toEqual({ ok: true, clientSecret: "cs_123" });
  });

  test("returns 404 when order missing", async () => {
    const markReturned = jest
      .fn<Promise<null>, [string]>()
      .mockResolvedValue(null);
    mockStripe();
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee: jest.fn(),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "missing" }));
    expect(markReturned).toHaveBeenCalledWith("bcd", "missing");
    expect(res.status).toBe(404);
  });

  test("no refund issued when refund amount is zero", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string]>()
      .mockResolvedValue({ deposit: 20 });
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi" });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 25);
    mockStripe({
      checkout: { sessions: { retrieve } },
      refunds: { create: refundCreate },
      paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: undefined }) },
    });
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "mild" }));
    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test("skips additional processing when damage fee is zero", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string]>()
      .mockResolvedValue({ deposit: 0 });
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi" });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 0);
    mockStripe({
      checkout: { sessions: { retrieve } },
      refunds: { create: refundCreate },
    });
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "none" }));
    expect(markReturned).toHaveBeenCalledTimes(1);
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess");
    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test("uses payment_intent object id when refunding", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string, string?]>()
      .mockResolvedValue({ deposit: 100 });
    const retrieve = jest
      .fn<Promise<{ payment_intent: { id: string } }>, [string, any]>()
      .mockResolvedValue({ payment_intent: { id: "pi_obj" } });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 30);
    mockStripe({
      checkout: { sessions: { retrieve } },
      refunds: { create: refundCreate },
      paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: undefined }) },
    });
    mockRentalRepo({ markReturned });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "scratch" }));
    expect(refundCreate).toHaveBeenCalledWith({
      payment_intent: "pi_obj",
      amount: 70 * 100,
    });
    expect(res.status).toBe(200);
  });

  test("handles missing refunds.create gracefully", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string, string?]>()
      .mockResolvedValue({ deposit: 100 });
    const markRefunded = jest.fn();
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi" });
    const computeDamageFee = jest.fn(async () => 30);
    mockStripe({ checkout: { sessions: { retrieve } }, refunds: undefined });
    mockRentalRepo({ markReturned, markRefunded });
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ coverageIncluded: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH(asNextJson({ sessionId: "sess", damage: "scratch" }));
    expect(res.status).toBe(200);
    expect(markRefunded).not.toHaveBeenCalled();
  });
});
