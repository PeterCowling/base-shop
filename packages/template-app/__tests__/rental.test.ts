import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/rental", () => {
  test("POST creates order with deposit and return date", async () => {
    const retrieve = jest
      .fn<
        Promise<{ metadata: { depositTotal: string; returnDate: string; items: string } }>,
        [string]
      >()
      .mockResolvedValue({
        metadata: {
          depositTotal: "50",
          returnDate: "2030-01-02",
          items: JSON.stringify([
            { sku: "sku1", from: "2025-01-01", to: "2025-01-05" },
          ]),
        },
      });
    const addOrder = jest.fn();
    const reserveRentalInventory = jest.fn();
    const readInventory = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
    const readProducts = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1" }]);

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
      markRefunded: jest.fn(),
    }));
    jest.doMock("@platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory,
    }));
    jest.doMock("@platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ rentalInventoryAllocation: true }),
    }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(reserveRentalInventory).toHaveBeenCalledWith(
      "bcd",
      [{ sku: "sku1", quantity: 1, variantAttributes: {} }],
      { sku: "sku1" },
      "2025-01-01",
      "2025-01-05",
    );
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 50, "2030-01-02");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("POST uses standard inventory flow when allocation disabled", async () => {
    const retrieve = jest
      .fn<
        Promise<{ metadata: { depositTotal: string; items: string } }>,
        [string]
      >()
      .mockResolvedValue({
        metadata: {
          depositTotal: "50",
          items: JSON.stringify([
            { sku: "sku1", from: "2025-01-01", to: "2025-01-05" },
          ]),
        },
      });
    const addOrder = jest.fn();
    const reserveRentalInventory = jest.fn();
    const updateInventoryItem = jest.fn();
    const readInventory = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
    const readProducts = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1" }]);

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
      markRefunded: jest.fn(),
    }));
    jest.doMock("@platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory,
    }));
    jest.doMock("@platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
      updateInventoryItem,
    }));
    jest.doMock("@platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ rentalInventoryAllocation: false }),
    }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);

    expect(reserveRentalInventory).not.toHaveBeenCalled();
    expect(updateInventoryItem).toHaveBeenCalledWith(
      "bcd",
      "sku1",
      {},
      expect.any(Function),
    );
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 50, undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("PATCH marks order returned and refunds when needed", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string, string?]>()
      .mockResolvedValue({
        deposit: 100,
      });
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi_1" });
    const refundCreate = jest.fn();
    const computeDamageFee = jest.fn(async () => 30);

    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve } },
          refunds: { create: refundCreate },
          paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: "cs" }) },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee,
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ rentalInventoryAllocation: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "sess", damage: "scratch" }),
    } as any);
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess");
    expect(markReturned).toHaveBeenCalledWith("bcd", "sess", 30);
    expect(computeDamageFee).toHaveBeenCalledWith("scratch", 100, []);
    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test("PATCH returns 404 when order missing", async () => {
    const markReturned = jest
      .fn<Promise<null>, [string]>()
      .mockResolvedValue(null);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));
    jest.doMock(
      "@acme/stripe",
      () => ({
        __esModule: true,
        stripe: {
          checkout: { sessions: { retrieve: jest.fn() } },
          refunds: { create: jest.fn() },
        },
      }),
      { virtual: true }
    );
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ rentalInventoryAllocation: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "missing" }),
    } as any);
    expect(markReturned).toHaveBeenCalledWith("bcd", "missing");
    expect(res.status).toBe(404);
  });

  test("no refund issued when refund amount is zero", async () => {
    const markReturned = jest
      .fn<Promise<{ deposit: number } | null>, [string]>()
      .mockResolvedValue({
        deposit: 20,
      });
    const retrieve = jest
      .fn<Promise<{ payment_intent: string }>, [string, any]>()
      .mockResolvedValue({ payment_intent: "pi" });
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
      addOrder: jest.fn(),
      markReturned,
      markRefunded: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({
      computeDamageFee,
    }));
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({ rentalInventoryAllocation: true }),
    }));

    const { PATCH } = await import("../src/api/rental/route");
    const res = await PATCH({
      json: async () => ({ sessionId: "sess", damage: "mild" }),
    } as any);
    expect(refundCreate).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
