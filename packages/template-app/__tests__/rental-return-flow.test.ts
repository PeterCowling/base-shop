/** @jest-environment node */
import { jest } from "@jest/globals";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

jest.setTimeout(60000);


async function withShop(
  cb: (
    repo: typeof import("@acme/platform-core/repositories/rentalOrders.server")
  ) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shop-"));
  await fs.mkdir(path.join(dir, "data", "shops", "bcd"), { recursive: true });
  await fs.mkdir(path.join(dir, "data", "rental"), { recursive: true });
  await fs.copyFile(
    path.resolve(__dirname, "../../../data/rental/pricing.json"),
    path.join(dir, "data", "rental", "pricing.json"),
  );
  await fs.writeFile(
    path.join(dir, "data", "shops", "bcd", "shop.json"),
    JSON.stringify({
      id: "bcd",
      name: "bcd",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      rentalInventoryAllocation: true,
      returnsEnabled: true,
      coverageIncluded: false,
    }),
  );
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  const repo: typeof import("@acme/platform-core/repositories/rentalOrders.server") = await import(
    "@acme/platform-core/repositories/rentalOrders.server"
  );
  try {
    await cb(repo);
  } finally {
    process.chdir(cwd);
  }
}

describe("rental order lifecycle", () => {
  test("order is returned and refunded", async () => {
    await withShop(async (repo) => {
      const reserveRentalInventory = jest.fn();
      const readInventory = jest
        .fn()
        .mockResolvedValue([{ sku: "sku1", quantity: 1, variantAttributes: {} }]);
      const readProducts = jest
        .fn()
        .mockResolvedValue([{ id: "sku1" }]);
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
        { virtual: true }
      );
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
