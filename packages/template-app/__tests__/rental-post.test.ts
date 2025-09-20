import { jest } from "@jest/globals";
import { mockStripe, mockRentalRepo } from "./helpers/rental";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


afterEach(() => jest.resetModules());

describe("/api/rental POST", () => {
  test("returns 400 when sessionId is missing", async () => {
    mockStripe();
    mockRentalRepo();
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
    jest.doMock("@platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn(),
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({ json: async () => ({}) } as any);
    expect(res.status).toBe(400);
  });

  test("creates order with deposit and return date", async () => {
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
    mockStripe({ checkout: { sessions: { retrieve } }, refunds: { create: jest.fn() } });
    const addOrder = jest.fn();
    mockRentalRepo({ addOrder });
    const reserveRentalInventory = jest.fn();
    const readInventory = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
    const readProducts = jest.fn().mockResolvedValue([{ id: "sku1" }]);
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
      readShop: async () => ({
        rentalInventoryAllocation: true,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(reserveRentalInventory).toHaveBeenCalledWith(
      "bcd",
      [{ sku: "sku1", quantity: 1, variantAttributes: {} }],
      { id: "sku1" },
      "2025-01-01",
      "2025-01-05",
    );
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 50, "2030-01-02");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("skips inventory reservation when allocation disabled", async () => {
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
    mockStripe({ checkout: { sessions: { retrieve } }, refunds: { create: jest.fn() } });
    const addOrder = jest.fn();
    mockRentalRepo({ addOrder });
    const reserveRentalInventory = jest.fn();
    const readInventory = jest
      .fn()
      .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
    const readProducts = jest.fn().mockResolvedValue([{ id: "sku1" }]);
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
      readShop: async () => ({
        rentalInventoryAllocation: false,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(readInventory).not.toHaveBeenCalled();
    expect(readProducts).not.toHaveBeenCalled();
    expect(reserveRentalInventory).not.toHaveBeenCalled();
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 50, "2030-01-02");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("skips reserving inventory for unknown SKUs", async () => {
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
            { sku: "missing", from: "2025-01-01", to: "2025-01-05" },
          ]),
        },
      });
    mockStripe({ checkout: { sessions: { retrieve } }, refunds: { create: jest.fn() } });
    const addOrder = jest.fn();
    mockRentalRepo({ addOrder });
    const reserveRentalInventory = jest.fn();
    const readInventory = jest.fn().mockResolvedValue([
      { sku: "sku1", quantity: 1, variantAttributes: {} },
      { sku: "missing", quantity: 1, variantAttributes: {} },
    ]);
    const readProducts = jest.fn().mockResolvedValue([{ id: "sku1" }]);
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
      readShop: async () => ({
        rentalInventoryAllocation: true,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST({
      json: async () => ({ sessionId: "sess" }),
    } as any);
    expect(reserveRentalInventory).toHaveBeenCalledTimes(1);
    expect(reserveRentalInventory).toHaveBeenCalledWith(
      "bcd",
      [{ sku: "sku1", quantity: 1, variantAttributes: {} }],
      { id: "sku1" },
      "2025-01-01",
      "2025-01-05",
    );
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 50, "2030-01-02");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
