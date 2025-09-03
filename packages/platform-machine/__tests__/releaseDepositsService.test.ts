export {};

import { logger } from "@platform-core/utils";

let service: typeof import("@acme/platform-machine");

process.env.STRIPE_SECRET_KEY = "sk";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
process.env.CART_COOKIE_SECRET = "secret";

const readdir = jest.fn();
const readFile = jest.fn();
jest.mock("node:fs/promises", () => ({ readdir, readFile }));

const retrieve = jest.fn();
const createRefund = jest.fn();
jest.mock(
  "@acme/stripe",
  () => ({
    stripe: {
      checkout: { sessions: { retrieve } },
      refunds: { create: createRefund },
    },
  }),
  { virtual: true }
);

const readOrders = jest.fn();
const markRefunded = jest.fn();
jest.mock("@platform-core/repositories/rentalOrders.server", () => ({
  readOrders,
  markRefunded,
}));

beforeEach(() => {
  jest.clearAllMocks();
  readFile.mockResolvedValue("{}");
});

describe("releaseDepositsOnce", () => {
  it("refunds deposits and marks orders as refunded", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      {
        sessionId: "sess1",
        returnedAt: "now",
        deposit: 10,
        damageFee: 2,
      },
      {
        sessionId: "sess2",
        returnedAt: "now",
        deposit: 10,
        damageFee: 12,
      },
      {
        sessionId: "sess3",
        deposit: 10,
      },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(createRefund).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 800,
    });
    expect(markRefunded).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "sess1");
    expect(markRefunded).toHaveBeenCalledWith("shop1", "sess2");
  });

  it("handles multiple shops", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readOrders
      .mockResolvedValueOnce([
        {
          sessionId: "s1",
          returnedAt: "now",
          deposit: 10,
        },
        {
          sessionId: "s2",
          deposit: 5,
        },
      ])
      .mockResolvedValueOnce([
        {
          sessionId: "s3",
          returnedAt: "now",
          deposit: 5,
        },
      ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenNthCalledWith(1, {
      payment_intent: "pi_1",
      amount: 1000,
    });
    expect(createRefund).toHaveBeenNthCalledWith(2, {
      payment_intent: "pi_1",
      amount: 500,
    });
    expect(markRefunded).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenNthCalledWith(1, "shop1", "s1");
    expect(markRefunded).toHaveBeenNthCalledWith(2, "shop2", "s3");
  });

  it("logs and continues on errors", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    createRefund
      .mockImplementationOnce(() => {
        throw new Error("fail");
      })
      .mockResolvedValueOnce({});
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("s1");
    expect(consoleSpy.mock.calls[0][0]).toContain("shop1");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain("s1");
    expect(logSpy.mock.calls[0][0]).toContain("shop1");

    consoleSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("skips orders when no payment intent is returned", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValueOnce({}).mockResolvedValueOnce({ payment_intent: "pi_2" });

    await service.releaseDepositsOnce();

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");
  });
});

describe("startDepositReleaseService", () => {
  it("uses per-shop configuration", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readOrders.mockResolvedValue([]);
    readFile
      .mockResolvedValueOnce(
        JSON.stringify({
          depositService: { enabled: true, intervalMinutes: 1 },
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          depositService: { enabled: true, intervalMinutes: 1 },
        }),
      );
    process.env.DEPOSIT_RELEASE_ENABLED_SHOP2 = "false";

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 123 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService();
    await Promise.resolve();
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(123 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();

    delete process.env.DEPOSIT_RELEASE_ENABLED_SHOP2;
  });

  it("runs each shop in parallel and schedules timers after initial run", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readFile.mockResolvedValue("{}");

    const resolvers: Record<string, () => void> = {};
    readOrders.mockImplementation((shop: string) => {
      return new Promise((resolve) => {
        resolvers[shop] = () => resolve([]);
      });
    });

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const startPromise = service.startDepositReleaseService();

    const flush = () => new Promise((r) => setTimeout(r, 0));

    await flush();
    expect(readOrders).toHaveBeenCalledTimes(2);
    expect(setSpy).not.toHaveBeenCalled();

    resolvers["shop1"]();
    await flush();
    expect(setSpy).toHaveBeenCalledTimes(1);

    resolvers["shop2"]();
    const stop = await startPromise;
    expect(setSpy).toHaveBeenCalledTimes(2);

    stop();
    expect(clearSpy).toHaveBeenCalledTimes(2);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("uses core env interval when shop env is missing", async () => {
    jest.resetModules();
    process.env.DEPOSIT_RELEASE_INTERVAL_MS = "120000";
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService();
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 120000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS;
  });

  it("prefers override intervalMinutes over env", async () => {
    jest.resetModules();
    process.env.DEPOSIT_RELEASE_INTERVAL_MS = "300000";
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService({
      shop1: { intervalMinutes: 7 },
    });
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 7 * 60 * 1000);

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS;
  });

  it("logs an error when releaseDepositsOnce throws", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([]);
    const err = new Error("boom");
    const releaseSpy = jest.fn(async () => {
      throw err;
    });
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);
    const logSpy = jest.fn();

    const stop = await service.startDepositReleaseService(
      {},
      undefined,
      releaseSpy,
      logSpy,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(releaseSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("deposit release failed", {
      shopId: "shop1",
      err,
    });

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("defaults to logger.error when releaseFn rejects", async () => {
    service = await import("@acme/platform-machine");
    const { logger: freshLogger } = await import("@platform-core/utils");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([]);
    const err = new Error("boom");
    const releaseSpy = jest.fn(async () => {
      throw err;
    });
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);
    const errorSpy = jest
      .spyOn(freshLogger, "error")
      .mockImplementation(() => undefined);

    const stop = await service.startDepositReleaseService(
      {},
      undefined,
      releaseSpy,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(releaseSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("deposit release failed", {
      shopId: "shop1",
      err,
    });

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe("auto-start", () => {
  it("auto-starts the service and logs failures", async () => {
    jest.resetModules();
    process.env.RUN_DEPOSIT_RELEASE_SERVICE = "true";
    readdir.mockRejectedValueOnce(new Error("boom"));
    const { logger: freshLogger } = await import("@platform-core/utils");
    const errorSpy = jest
      .spyOn(freshLogger, "error")
      .mockImplementation(() => undefined);

    await import("@acme/platform-machine/releaseDepositsService");
    await Promise.resolve();

    expect(readdir).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "failed to start deposit release service",
      expect.objectContaining({ err: expect.any(Error) }),
    );

    errorSpy.mockRestore();
    delete process.env.RUN_DEPOSIT_RELEASE_SERVICE;
  });
});
