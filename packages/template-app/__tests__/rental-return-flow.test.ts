import { jest } from "@jest/globals";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

async function withShop(
  cb: (
    repo: typeof import("../../platform-core/src/repositories/rentalOrders.server")
  ) => Promise<void>,
) {
  const orders: any[] = [];
  const repo = {
    readOrders: async () => orders,
    addOrder: async (
      shop: string,
      sessionId: string,
      deposit: number,
      expected?: string,
    ) => {
      orders.push({ shop, sessionId, deposit, expected } as any);
    },
    markReturned: async (
      shop: string,
      sessionId: string,
      damageFee?: number,
    ) => {
      const order = orders.find((o) => o.sessionId === sessionId);
      if (!order) return null;
      order.returnedAt = new Date().toISOString();
      if (damageFee !== undefined) order.damageFee = damageFee;
      return order;
    },
    markRefunded: async (shop: string, sessionId: string) => {
      const order = orders.find((o) => o.sessionId === sessionId);
      if (!order) return null;
      order.refundedAt = new Date().toISOString();
      return order;
    },
  } as any;
  jest.resetModules();
  jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
    __esModule: true,
    addOrder: repo.addOrder,
    markReturned: repo.markReturned,
    markRefunded: repo.markRefunded,
    readOrders: repo.readOrders,
  }));
  jest.doMock("@platform-core/repositories/shops.server", () => ({
    __esModule: true,
    readShop: async () => ({
      rentalInventoryAllocation: true,
      returnsEnabled: true,
    }),
  }));
  await cb(repo);
}

describe("rental order lifecycle", () => {
  test("order is returned and refunded", async () => {
    await withShop(async (repo) => {
      const reserveRentalInventory = jest.fn();
      const readInventory = jest
        .fn()
        .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
      const readProducts = jest.fn().mockResolvedValue([{ sku: "sku1" }]);
      const retrieve = jest
        .fn<Promise<any>, any[]>()
        .mockResolvedValueOnce({
          metadata: {
            depositTotal: "50",
            returnDate: "2030-01-02",
            items: JSON.stringify([
              { sku: "sku1", from: "2025-01-01", to: "2025-01-05" },
            ]),
          },
        })
        .mockResolvedValueOnce({
          metadata: { depositTotal: "50" },
          payment_intent: { id: "pi_1" },
        });
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
        { virtual: true },
      );
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
      jest.doMock("@platform-core/src/pricing", () => ({
        computeDamageFee: jest.fn(async () => 20),
      }));

      const { POST: rentalPost } = await import("../src/api/rental/route");
      const { POST: returnPost } = await import("../src/api/return/route");

      await rentalPost({ json: async () => ({ sessionId: "sess" }) } as any);
      await returnPost({
        json: async () => ({ sessionId: "sess", damage: "scuff" }),
      } as any);

      const orders = await repo.readOrders("bcd");
      expect(orders).toHaveLength(1);
      expect(orders[0].damageFee).toBe(20);
      expect(orders[0].returnedAt).toBeDefined();
      expect(orders[0].refundedAt).toBeDefined();
      expect(refundCreate).toHaveBeenCalled();
      expect(reserveRentalInventory).toHaveBeenCalled();
    });
  });
});
