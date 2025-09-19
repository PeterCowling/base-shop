import { logger } from "@platform-core/utils";
import {
  resetReleaseDepositsEnv,
  restoreOriginalEnv,
  readdir,
  readFile,
  retrieve,
  createRefund,
  readOrders,
  markRefunded,
} from "./helpers/releaseDepositsSetup";

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReleaseDepositsEnv();
});

afterEach(() => {
  restoreOriginalEnv();
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

  it("disables shops via configs even when settings enable them", async () => {
    service = await import("@acme/platform-machine");
    readdir.mockResolvedValue(["shop1", "shop2"]);
    readOrders.mockResolvedValue([]);
    readFile.mockResolvedValue(
      JSON.stringify({ depositService: { enabled: true, intervalMinutes: 1 } }),
    );

    const releaseSpy = jest.fn();
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 0 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await service.startDepositReleaseService(
      { shop1: { enabled: false } },
      undefined,
      releaseSpy,
    );
    await Promise.resolve();

    expect(releaseSpy).toHaveBeenCalledTimes(1);
    expect(releaseSpy).toHaveBeenCalledWith("shop2", expect.any(String));
    expect(releaseSpy).not.toHaveBeenCalledWith("shop1", expect.anything());
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledTimes(1);

    setSpy.mockRestore();
    clearSpy.mockRestore();
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
    const errorSpy = jest
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

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
