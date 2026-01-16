// packages/platform-machine/__tests__/depositService.test.ts
import type { RentalOrder } from "@acme/types";

// The Stripe SDK transitively pulls in zod utilities which use top-level
// `await` in their published ESM build.  Jest runs tests in CommonJS and
// would choke on that syntax, so we stub the initializer before any modules
// are imported.
jest.mock("@acme/zod-utils/initZod", () => ({}));

describe("releaseDepositsOnce", () => {
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

  it("refunds returned deposits and marks orders", async () => {
    const stripeModule = await import("@acme/stripe");
    const stripeRetrieve = jest
      .fn()
      .mockResolvedValue({ payment_intent: { id: "pi_obj" } });
    const stripeRefund = jest.fn().mockResolvedValue({});
    stripeModule.stripe.checkout.sessions.retrieve = stripeRetrieve as any;
    stripeModule.stripe.refunds.create = stripeRefund as any;

    const orders: RentalOrder[] = [
      {
        id: "1",
        sessionId: "sess1",
        shop: "test",
        deposit: 10,
        damageFee: 2,
        startedAt: "2024-01-01",
        returnedAt: "2024-01-02",
      },
      {
        id: "2",
        sessionId: "sess2",
        shop: "test",
        deposit: 10,
        startedAt: "2024-01-01",
        returnedAt: "2024-01-02",
        refundedAt: "2024-01-03",
      },
      {
        id: "3",
        sessionId: "sess3",
        shop: "test",
        deposit: 0,
        startedAt: "2024-01-01",
        returnedAt: "2024-01-02",
      },
      {
        id: "4",
        sessionId: "sess4",
        shop: "test",
        deposit: 5,
        startedAt: "2024-01-01",
      },
    ];

    const readOrders = jest.fn().mockResolvedValue(orders);
    const markRefunded = jest.fn().mockResolvedValue(null);
    jest.doMock("@acme/platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders,
      markRefunded,
    }));

    const readdir = jest.fn().mockResolvedValue(["test"]);
    jest.doMock("node:fs/promises", () => ({ __esModule: true, readdir }));

    const { logger } = await import("@acme/platform-core/utils");
    const logSpy = jest
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    const { releaseDepositsOnce } = await import(
      "@acme/platform-machine/releaseDepositsService"
    );
    await releaseDepositsOnce();

    expect(stripeRetrieve).toHaveBeenCalledTimes(1);
    expect(stripeRetrieve).toHaveBeenCalledWith("sess1", {
      expand: ["payment_intent"],
    });

    expect(stripeRefund).toHaveBeenCalledTimes(1);
    expect(stripeRefund).toHaveBeenCalledWith({
      payment_intent: "pi_obj",
      amount: 8 * 100,
    });

    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("test", "sess1");
    expect(logSpy).toHaveBeenCalledWith("refunded deposit", {
      shopId: "test",
      sessionId: "sess1",
    });

    logSpy.mockRestore();
  });
});
