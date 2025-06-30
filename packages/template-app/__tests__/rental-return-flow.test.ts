import { jest } from "@jest/globals";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

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
  const repo: typeof import("@platform-core/repositories/rentalOrders") = require("@platform-core/repositories/rentalOrders");
  try {
    await cb(repo);
  } finally {
    process.chdir(cwd);
  }
}

describe("rental order lifecycle", () => {
  test("order is returned and refunded", async () => {
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
        "@/lib/stripeServer",
        () => ({
          __esModule: true,
          stripe: {
            checkout: { sessions: { retrieve } },
            refunds: { create: refundCreate },
          },
        }),
        { virtual: true }
      );

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
    });
  });
});
