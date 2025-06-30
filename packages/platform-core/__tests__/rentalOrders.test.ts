import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../repositories/rentalOrders.server"),
    shop: string,
    dir: string
  ) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "orders-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const repo = await import("../repositories/rentalOrders.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("rental order repository", () => {
  it("readOrders returns empty array when file missing or invalid", async () => {
    await withRepo(async (repo, shop, dir) => {
      expect(await repo.readOrders(shop)).toEqual([]);

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "rental_orders.json"),
        "invalid",
        "utf8"
      );

      expect(await repo.readOrders(shop)).toEqual([]);
    });
  });

  it("adds orders and updates status", async () => {
    await withRepo(async (repo, shop) => {
      const order = await repo.addOrder(shop, "sess", 42, "2025-01-01");
      expect(order).toMatchObject({
        sessionId: "sess",
        deposit: 42,
        expectedReturnDate: "2025-01-01",
        shop,
      });

      let orders = await repo.readOrders(shop);
      expect(orders).toHaveLength(1);

      const returned = await repo.markReturned(shop, "sess");
      expect(returned?.returnedAt).toBeDefined();

      const refunded = await repo.markRefunded(shop, "sess");
      expect(refunded?.refundedAt).toBeDefined();

      orders = await repo.readOrders(shop);
      expect(orders[0].returnedAt).toBeDefined();
      expect(orders[0].refundedAt).toBeDefined();

      const missing = await repo.markReturned(shop, "missing");
      expect(missing).toBeNull();
    });
  });
});
