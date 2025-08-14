import type { RentalOrder } from "@acme/types";

describe("chargeLateFeesOnce", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
    } as NodeJS.ProcessEnv;
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("charges overdue orders and marks them", async () => {
    const stripeModule = await import("@acme/stripe");
    const retrieve = jest.fn().mockResolvedValue({ customer: "cus_1" });
    const create = jest.fn().mockResolvedValue({});
    stripeModule.stripe.checkout.sessions.retrieve = retrieve as any;
    stripeModule.stripe.paymentIntents.create = create as any;

    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        deposit: 0,
        startedAt: "2024-01-01",
        returnDueDate: "2024-01-01",
      },
      {
        id: "2",
        sessionId: "sess2",
        shop: "test",
        deposit: 0,
        startedAt: "2024-01-01",
        returnDueDate: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    const readOrders = jest.fn().mockResolvedValue(orders);
    const markLateFeeCharged = jest.fn().mockResolvedValue(null);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders,
      markLateFeeCharged,
    }));

    const getShopById = jest
      .fn()
      .mockResolvedValue({ lateFeePolicy: { gracePeriodDays: 0, feeAmount: 5 } });
    jest.doMock("@platform-core/repositories/shop.server", () => ({
      __esModule: true,
      getShopById,
    }));

    const { chargeLateFeesOnce } = await import("@acme/platform-machine");
    await chargeLateFeesOnce("test");

    expect(retrieve).toHaveBeenCalledWith("sess1", { expand: ["customer"] });
    expect(create).toHaveBeenCalledWith({
      amount: 5 * 100,
      currency: "usd",
      customer: "cus_1",
      payment_method_types: ["card"],
    });
    expect(markLateFeeCharged).toHaveBeenCalledWith("test", "sess1", 5);
  });
});
