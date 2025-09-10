export {};

import { logger } from "@platform-core/utils";

let service: typeof import("@acme/platform-machine");

process.env.STRIPE_SECRET_KEY = "sk";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
process.env.CART_COOKIE_SECRET = "secret";

const ORIGINAL_ENV = { ...process.env };

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
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
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

  it("logs info after refunding a deposit", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      {
        sessionId: "s1",
        returnedAt: "now",
        deposit: 10,
        damageFee: 2,
      },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    const logSpy = jest
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(createRefund).toHaveBeenCalledTimes(1);
    expect(createRefund).toHaveBeenCalledWith({
      payment_intent: "pi_1",
      amount: 800,
    });
    expect(logSpy).toHaveBeenCalledWith("refunded deposit", {
      shopId: "shop1",
      sessionId: "s1",
    });

    logSpy.mockRestore();
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

  it("logs errors and continues processing remaining orders", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readOrders.mockResolvedValue([
      { sessionId: "s1", returnedAt: "now", deposit: 10 },
      { sessionId: "s2", returnedAt: "now", deposit: 10 },
    ]);
    retrieve.mockResolvedValue({ payment_intent: "pi_1" });
    const err = new Error("fail");
    createRefund
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({});
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    await service.releaseDepositsOnce();

    expect(logSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop1 s1",
      { err },
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to release deposit for shop1 s1",
      err,
    );
    expect(createRefund).toHaveBeenCalledTimes(2);
    expect(createRefund).toHaveBeenNthCalledWith(2, {
      payment_intent: "pi_1",
      amount: 1000,
    });
    expect(markRefunded).toHaveBeenCalledTimes(1);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "s2");

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

  it("disables service by default when core env disables it", async () => {
    jest.resetModules();
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { DEPOSIT_RELEASE_ENABLED: false },
      loadCoreEnv: () => ({ DEPOSIT_RELEASE_ENABLED: false }),
    }));
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
    expect(setSpy).not.toHaveBeenCalled();
    expect(readOrders).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    jest.dontMock("@acme/config/env/core");
    jest.resetModules();
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
    const errorSpy = jest.spyOn(logger, "error");

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
    expect(errorSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("runs multiple shops without overlap using accelerated intervals", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readFile.mockResolvedValue("{}");

    const running: Record<string, boolean> = { shop1: false, shop2: false };
    const metrics = { memory: [] as number[], durations: [] as number[] };
    let overlaps = 0;

    const releaseFn = jest.fn(async (shop: string) => {
      if (running[shop]) overlaps++;
      running[shop] = true;
      const start = Date.now();
      await new Promise((r) => setTimeout(r, 20));
      metrics.durations.push(Date.now() - start);
      metrics.memory.push(process.memoryUsage().heapUsed);
      running[shop] = false;
    });

    const unhandled: unknown[] = [];
    const handler = (err: unknown) => unhandled.push(err);
    process.on("unhandledRejection", handler);

    jest.useFakeTimers();
    const startPromise = service.startDepositReleaseService(
      { shop1: { intervalMinutes: 0.001 }, shop2: { intervalMinutes: 0.001 } },
      undefined,
      releaseFn,
    );

    await jest.advanceTimersByTimeAsync(20);
    const stop = await startPromise;
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(60);
      await jest.advanceTimersByTimeAsync(20);
    }
    stop();
    jest.useRealTimers();
    process.off("unhandledRejection", handler);

    expect(releaseFn).toHaveBeenCalledTimes(12);
    expect(overlaps).toBe(0);
    expect(unhandled).toHaveLength(0);
    expect(metrics.memory.length).toBe(12);
    expect(metrics.durations.every((d) => d >= 20)).toBe(true);
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

  it("rejects when readdir fails without scheduling timers", async () => {
    service = await import("@acme/platform-machine");
    const err = new Error("boom");
    readdir.mockRejectedValueOnce(err);
    const setSpy = jest.spyOn(global, "setInterval");
    await expect(service.startDepositReleaseService()).rejects.toBe(err);
    expect(setSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
  });

});

describe("config resolution", () => {
  it("retains enabled service when settings enable it and core env disables it", async () => {
    jest.resetModules();
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { DEPOSIT_RELEASE_ENABLED: false },
      loadCoreEnv: () => ({ DEPOSIT_RELEASE_ENABLED: false }),
    }));
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ depositService: { enabled: true } }),
    );
    readOrders.mockResolvedValue([]);
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService();
    expect(setSpy).toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    jest.dontMock("@acme/config/env/core");
    jest.resetModules();
  });

  it("uses core interval when shop env interval is invalid", async () => {
    jest.resetModules();
    process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP1 = "abc";
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { DEPOSIT_RELEASE_INTERVAL_MS: 120000 },
      loadCoreEnv: () => ({ DEPOSIT_RELEASE_INTERVAL_MS: 120000 }),
    }));
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
    jest.dontMock("@acme/config/env/core");
    jest.resetModules();
  });
});

describe("auto-start", () => {
  afterEach(() => {
    delete process.env.RUN_DEPOSIT_RELEASE_SERVICE;
    jest.unmock("../src/releaseDepositsService");
    jest.unmock("@acme/platform-machine/releaseDepositsService");
    jest.unmock("../releaseDepositsService");
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("runs the service on import when enabled", async () => {
    jest.resetModules();
    process.env.RUN_DEPOSIT_RELEASE_SERVICE = "true";
    const startMock = jest.fn().mockResolvedValue(undefined);
    jest.doMock("../src/releaseDepositsService", () => {
      if (process.env.RUN_DEPOSIT_RELEASE_SERVICE === "true") {
        startMock().catch(() => undefined);
      }
      return { startDepositReleaseService: startMock };
    });

    await import("@acme/platform-machine/releaseDepositsService");

    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("logs errors when startup fails", async () => {
    jest.resetModules();
    process.env.RUN_DEPOSIT_RELEASE_SERVICE = "true";
    const err = new Error("boom");
    const startMock = jest.fn().mockRejectedValue(err);
    const logSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    jest.doMock("../src/releaseDepositsService", () => {
      if (process.env.RUN_DEPOSIT_RELEASE_SERVICE === "true") {
        startMock().catch((e) => {
          logger.error("failed to start deposit release service", { err: e });
          console.error("failed to start deposit release service", e);
        });
      }
      return { startDepositReleaseService: startMock };
    });

    await import("@acme/platform-machine/releaseDepositsService");
    await Promise.resolve();

    expect(startMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      "failed to start deposit release service",
      { err },
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "failed to start deposit release service",
      err,
    );

    logSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
