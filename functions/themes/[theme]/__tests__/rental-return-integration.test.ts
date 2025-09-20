import { jest } from "@jest/globals";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


async function withShop(
  cb: (
    repo: typeof import("@platform-core/repositories/rentalOrders")
  ) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shop-"));
  await fs.mkdir(path.join(dir, "data", "shops", "bcd"), { recursive: true });
  await fs.mkdir(path.join(dir, "data", "rental"), { recursive: true });
  await fs.copyFile(
    path.join(__dirname, "../../..", "data", "rental", "pricing.json"),
    path.join(dir, "data", "rental", "pricing.json")
  );
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  const orders: any[] = [];
  const repo = {
    async readOrders(shop: string) {
      return orders.filter((o) => o.shop === shop);
    },
    async addOrder(
      shop: string,
      sessionId: string,
      deposit: number,
      expected?: string,
    ) {
      orders.push({ shop, sessionId, deposit, expected });
    },
    async markReturned(shop: string, sessionId: string, damage?: number) {
      const order = orders.find(
        (o) => o.shop === shop && o.sessionId === sessionId,
      );
      if (!order) return null;
      order.status = "returned";
      if (damage) order.damageFee = damage;
      return order;
    },
    async markRefunded(shop: string, sessionId: string) {
      const order = orders.find(
        (o) => o.shop === shop && o.sessionId === sessionId,
      );
      if (!order) return null;
      order.refundedAt = new Date().toISOString();
      return order;
    },
  };
  jest.doMock(
    "@platform-core/repositories/rentalOrders.server",
    () => ({ __esModule: true, ...repo }),
    { virtual: true },
  );
  jest.doMock(
    "@platform-core/repositories/rentalOrders",
    () => ({ __esModule: true, ...repo }),
    { virtual: true },
  );
  jest.doMock(
    "@platform-core/repositories/shops.server",
    () => ({ __esModule: true, readShop: async () => ({ coverageIncluded: false }) }),
    { virtual: true },
  );
  jest.doMock(
    "@acme/zod-utils/initZod",
    () => ({ initZod: () => {} }),
    { virtual: true },
  );
  try {
    await cb(repo as any);
  } finally {
    process.chdir(cwd);
  }
}

test("rental order is returned and refunded", async () => {
  await withShop(async (repo) => {
    const retrieve = jest
      .fn()
      .mockResolvedValueOnce({
        metadata: { depositTotal: "50", returnDate: "2030-01-02" },
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

    const { POST: rentalPost } = await import(
      "../../../../apps/shop-bcd/src/api/rental/route"
    );
    const { POST: returnPost } = await import(
      "../../../../apps/shop-bcd/src/api/return/route"
    );

    await rentalPost(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ sessionId: "sess" }),
      }) as any,
    );
    await returnPost(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ sessionId: "sess", damage: "scuff" }),
      }) as any,
    );

    const orders = await repo.readOrders("bcd");
    expect(orders).toHaveLength(1);
    expect(orders[0].refundedAt).toBeDefined();
    expect(refundCreate).toHaveBeenCalled();
  });
});
