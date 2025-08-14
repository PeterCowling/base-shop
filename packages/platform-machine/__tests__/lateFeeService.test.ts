// packages/platform-machine/__tests__/lateFeeService.test.ts
import type { RentalOrder } from "@acme/types";

describe("chargeLateFeesOnce", () => {
  const OLD_ENV = process.env;
  const OLD_NOW = Date.now;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
    } as NodeJS.ProcessEnv;
    Date.now = jest.fn(() => new Date("2024-01-10T00:00:00Z").getTime());
  });

  afterEach(() => {
    process.env = OLD_ENV;
    Date.now = OLD_NOW;
  });

  it("charges overdue orders and marks them", async () => {
    const stripeModule = await import("@acme/stripe");
    const stripeRetrieve = jest.fn().mockResolvedValue({
      customer: "cus_1",
      payment_intent: { payment_method: "pm_1" },
      currency: "usd",
    });
    const stripeCharge = jest.fn().mockResolvedValue({});
    stripeModule.stripe.checkout.sessions.retrieve = stripeRetrieve as any;
    stripeModule.stripe.paymentIntents.create = stripeCharge as any;

    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        returnDueDate: "2024-01-01",
      },
      {
        id: "2",
        sessionId: "sess2",
        shop: "test",
        returnDueDate: "2024-01-05",
        returnReceivedAt: "2024-01-06",
      },
      {
        id: "3",
        sessionId: "sess3",
        shop: "test",
        returnDueDate: "2024-01-09",
      },
      {
        id: "4",
        sessionId: "sess4",
        shop: "test",
        returnDueDate: "2024-01-01",
        lateFeeCharged: 25,
      },
    ];

    const readOrders = jest.fn().mockResolvedValue(orders);
    const markLateFeeCharged = jest.fn().mockResolvedValue(null);
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders,
      markLateFeeCharged,
    }));

    const readFile = jest.fn().mockImplementation(async (path: string) => {
      if (path.endsWith("shop.json")) {
        return JSON.stringify({
          lateFeePolicy: { gracePeriodDays: 3, feeAmount: 25 },
        });
      }
      throw new Error("not found");
    });
    const readdir = jest.fn().mockResolvedValue(["test"]);
    jest.doMock("node:fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir,
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    await chargeLateFeesOnce();

    expect(stripeRetrieve).toHaveBeenCalledTimes(1);
    expect(stripeRetrieve).toHaveBeenCalledWith("sess1", {
      expand: ["payment_intent", "customer"],
    });

    expect(stripeCharge).toHaveBeenCalledTimes(1);
    expect(stripeCharge).toHaveBeenCalledWith({
      amount: 25 * 100,
      currency: "usd",
      customer: "cus_1",
      payment_method: "pm_1",
      off_session: true,
      confirm: true,
    });

    expect(markLateFeeCharged).toHaveBeenCalledTimes(1);
    expect(markLateFeeCharged).toHaveBeenCalledWith("test", "sess1", 25);
  });
});
