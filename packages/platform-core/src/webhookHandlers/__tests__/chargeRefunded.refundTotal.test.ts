import type Stripe from "stripe";

// This test requires a real database connection
const describeFn = process.env.DATABASE_URL ? describe : describe.skip;

describeFn("webhookHandlers/chargeRefunded refund totals", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("persists refundTotal by stripeChargeId match", async () => {
    const { prisma } = await import("../../db");
    const handler = (await import("../chargeRefunded")).default as typeof import("../chargeRefunded").default;

    await prisma.rentalOrder.create({
      data: {
        id: "ord_1",
        shop: "shop1",
        sessionId: "cs_1",
        deposit: 2500,
        stripeChargeId: "ch_1",
      },
    });

    const event = {
      data: {
        object: {
          id: "ch_1",
          amount_refunded: 500,
          payment_intent: "pi_1",
        },
      },
    } as unknown as Stripe.Event;

    await handler("shop1", event);

    const updated = await prisma.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "shop1", sessionId: "cs_1" } },
    });

    expect(updated?.refundTotal).toBe(500);
    expect(typeof updated?.refundedAt).toBe("string");
  });

  test("persists refundTotal by stripePaymentIntentId match", async () => {
    const { prisma } = await import("../../db");
    const handler = (await import("../chargeRefunded")).default as typeof import("../chargeRefunded").default;

    await prisma.rentalOrder.create({
      data: {
        id: "ord_2",
        shop: "shop2",
        sessionId: "cs_2",
        deposit: 1000,
        stripePaymentIntentId: "pi_2",
      },
    });

    const event = {
      data: {
        object: {
          id: "ch_unmapped",
          amount_refunded: 1000,
          payment_intent: "pi_2",
        },
      },
    } as unknown as Stripe.Event;

    await handler("shop2", event);

    const updated = await prisma.rentalOrder.findUnique({
      where: { shop_sessionId: { shop: "shop2", sessionId: "cs_2" } },
    });

    expect(updated?.refundTotal).toBe(1000);
    expect(typeof updated?.refundedAt).toBe("string");
  });
});
