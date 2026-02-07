import { jest } from "@jest/globals";

import { asNextJson } from "@acme/test-utils";

import { mockRentalRepo,mockStripe } from "./helpers/rental";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


afterEach(() => jest.resetModules());

describe("/api/rental POST", () => {
  test("returns 400 when sessionId is missing", async () => {
    mockStripe();
    mockRentalRepo();
    jest.doMock("@acme/platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: jest.fn(),
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST(asNextJson({}));
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
    jest.doMock("@acme/platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({
        rentalInventoryAllocation: true,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));
    expect(retrieve).toHaveBeenCalledWith("sess");
    expect(reserveRentalInventory).toHaveBeenCalledWith(
      "bcd",
      [{ sku: "sku1", quantity: 1, variantAttributes: {} }],
      { id: "sku1" },
      "2025-01-01",
      "2025-01-05",
    );
    expect(addOrder).toHaveBeenCalledWith({
      shop: "bcd",
      sessionId: "sess",
      deposit: 50,
      expectedReturnDate: "2030-01-02",
    });
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
    jest.doMock("@acme/platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({
        rentalInventoryAllocation: false,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));
    expect(readInventory).not.toHaveBeenCalled();
    expect(readProducts).not.toHaveBeenCalled();
    expect(reserveRentalInventory).not.toHaveBeenCalled();
    expect(addOrder).toHaveBeenCalledWith({
      shop: "bcd",
      sessionId: "sess",
      deposit: 50,
      expectedReturnDate: "2030-01-02",
    });
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
    jest.doMock("@acme/platform-core/orders/rentalAllocation", () => ({
      __esModule: true,
      reserveRentalInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/inventory.server", () => ({
      __esModule: true,
      readInventory,
    }));
    jest.doMock("@acme/platform-core/repositories/products.server", () => ({
      __esModule: true,
      readRepo: readProducts,
    }));
    jest.doMock("@acme/platform-core/repositories/shops.server", () => ({
      __esModule: true,
      readShop: async () => ({
        rentalInventoryAllocation: true,
        coverageIncluded: true,
      }),
    }));
    jest.doMock("@acme/platform-core/pricing", () => ({ computeDamageFee: jest.fn() }));

    const { POST } = await import("../src/api/rental/route");
    const res = await POST(asNextJson({ sessionId: "sess" }));
    expect(reserveRentalInventory).toHaveBeenCalledTimes(1);
    expect(reserveRentalInventory).toHaveBeenCalledWith(
      "bcd",
      [{ sku: "sku1", quantity: 1, variantAttributes: {} }],
      { id: "sku1" },
      "2025-01-01",
      "2025-01-05",
    );
    expect(addOrder).toHaveBeenCalledWith({
      shop: "bcd",
      sessionId: "sess",
      deposit: 50,
      expectedReturnDate: "2030-01-02",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
