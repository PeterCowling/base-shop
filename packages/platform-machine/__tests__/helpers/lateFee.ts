import type { RentalOrder } from "@acme/types";

export const NOW = new Date("2024-01-10T00:00:00Z").getTime();

interface SetupOptions {
  orders: RentalOrder[];
  shop?: unknown;
}

export async function setupLateFeeTest({ orders, shop }: SetupOptions) {
  jest.resetModules();

  const oldEnv = process.env;
  const oldNow = Date.now;

  process.env = {
    ...oldEnv,
    STRIPE_SECRET_KEY: "sk_test",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
  } as NodeJS.ProcessEnv;
  Date.now = jest.fn(() => NOW);

  const stripeRetrieve = jest.fn().mockResolvedValue({
    customer: "cus_1",
    payment_intent: { payment_method: "pm_1" },
    currency: "usd",
  });
  const stripeCharge = jest.fn().mockResolvedValue({});
  jest.doMock("@acme/stripe", () => ({
    __esModule: true,
    stripe: {
      checkout: { sessions: { retrieve: stripeRetrieve } },
      paymentIntents: { create: stripeCharge },
    },
  }));

  const readOrders = jest.fn().mockResolvedValue(orders);
  const markLateFeeCharged = jest.fn().mockResolvedValue(null);
  jest.doMock("@acme/platform-core/repositories/rentalOrders.server", () => ({
    __esModule: true,
    readOrders,
    markLateFeeCharged,
  }));
  jest.doMock("@acme/platform-core/utils", () => ({
    __esModule: true,
    logger: { info: jest.fn(), error: jest.fn() },
  }));

  const readFile = jest.fn().mockImplementation(async (path: string) => {
    if (path.endsWith("shop.json")) {
      return JSON.stringify(
        shop ?? { lateFeePolicy: { gracePeriodDays: 3, feeAmount: 25 } },
      );
    }
    throw new Error("not found");
  });
  const readdir = jest.fn().mockResolvedValue(["test"]);
  jest.doMock("fs/promises", () => ({
    __esModule: true,
    readFile,
    readdir,
  }));

  return {
    stripeRetrieve,
    stripeCharge,
    readOrders,
    markLateFeeCharged,
    readFile,
    readdir,
    restore() {
      process.env = oldEnv;
      Date.now = oldNow;
    },
  };
}
