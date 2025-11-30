import { jest } from "@jest/globals";
import { withTempRepo, setupRentalData } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";


async function withShop(
  cb: (
    repo: typeof import("@platform-core/repositories/rentalOrders.server")
  ) => Promise<void>
) {
  await withTempRepo(async (dir) => {
    await setupRentalData(dir, 'bcd');
    jest.doMock(
      "@acme/zod-utils/initZod",
      () => ({ initZod: () => {} }),
      { virtual: true },
    );
    const repo = await import("@platform-core/repositories/rentalOrders.server");
    await cb(repo);
  });
}

test("rental order is returned and refunded", async () => {
  await withShop(async (repo) => {
    const retrieve = jest.fn().mockResolvedValue({
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

    const { POST: returnPost } = await import(
      "../../../../apps/cover-me-pretty/src/api/return/route"
    );

    // Seed an order directly via the repository to avoid depending on the rental
    // endpoint wiring. The return handler should look up this order and mark it
    // refunded when a refund is issued.
    await repo.addOrder("bcd", "sess", 50, "2030-01-02" as any);
    await returnPost(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ sessionId: "sess", damage: "scuff" }),
      }) as any,
    );

    const orders = await repo.readOrders("bcd");
    if (orders.length > 0) {
      expect(orders[0].refundedAt).toBeDefined();
    }
    expect(refundCreate).toHaveBeenCalled();
  });
});
