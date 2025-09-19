describe("startLateFeeService", () => {
  const OLD_ENV = process.env;
  let error: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        paymentIntents: { create: jest.fn() },
      },
    }));
    error = jest.fn();
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("skips disabled shops and schedules timers", async () => {
    const readdir = jest.fn().mockResolvedValue(["a", "b"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("a/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: false } })
        );
      if (path.endsWith("b/settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (path.endsWith("b/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile,
    }));

    const mod = await import("../src/lateFeeService");

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(60000);
        return 111 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    const paths = readFile.mock.calls.map((c) => c[0]);
    expect(paths).toContain("/data/a/settings.json");
    expect(paths).not.toContain("/data/a/shop.json");
    expect(
      paths.filter((p) => p.includes("b/shop.json")).length
    ).toBeGreaterThan(0);
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("uses core env interval when shop env invalid", async () => {
    process.env.LATE_FEE_INTERVAL_MS_SHOP = "xyz";
    const { coreEnv } = await import("@acme/config/env/core");
    coreEnv.LATE_FEE_INTERVAL_MS = 120000;

    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: true } }),
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } }),
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir, readFile }));

    const mod = await import("../src/lateFeeService");
    jest.spyOn(mod, "chargeLateFeesOnce").mockResolvedValue();

    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 120000);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
    delete process.env.LATE_FEE_INTERVAL_MS_SHOP;
    delete coreEnv.LATE_FEE_INTERVAL_MS;
  });

  it("logs errors from chargeLateFeesOnce", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } })
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir, readFile }));
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const err = new Error("boom");
    jest.doMock("@platform-core/repositories/rentalOrders.server", () => ({
      __esModule: true,
      readOrders: jest.fn().mockRejectedValue(err),
      markLateFeeCharged: jest.fn(),
    }));
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        paymentIntents: { create: jest.fn() },
      },
    }));

    const mod = await import("../src/lateFeeService");
    const stop = await mod.startLateFeeService();

    expect(error).toHaveBeenCalledWith("late fee processing failed", {
      shopId: "shop",
      err,
    });

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("returns early when shop settings are inaccessible", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          })
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.reject(new Error("denied"));
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir, readFile }));

    const mod = await import("../src/lateFeeService");
    const chargeSpy = jest.spyOn(mod, "chargeLateFeesOnce").mockResolvedValue();
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    expect(chargeSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("applies start config overrides", async () => {
    const { setupLateFeeTest, NOW } = await import("./helpers/lateFee");
    const overdueOrder = {
      sessionId: "sess_1",
      returnDueDate: new Date(NOW - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;
    const mocks = await setupLateFeeTest({ orders: [overdueOrder] });
    process.env.LATE_FEE_ENABLED_TEST = "false";
    process.env.LATE_FEE_INTERVAL_MS_TEST = "600000";
    mocks.readFile.mockImplementation((path: string) => {
      if (path.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: false, intervalMinutes: 10 },
          }),
        );
      if (path.endsWith("shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 25 } }),
        );
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: { LATE_FEE_ENABLED: false, LATE_FEE_INTERVAL_MS: 300000 },
      loadCoreEnv: () => ({
        LATE_FEE_ENABLED: false,
        LATE_FEE_INTERVAL_MS: 300000,
      }),
    }));

    const mod = await import("../src/lateFeeService");
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation((fn: any, ms?: number) => {
        expect(ms).toBe(120000);
        return 111 as any;
      });
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService({
      test: { enabled: true, intervalMinutes: 2 },
    });

    expect(mocks.stripeCharge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25 * 100, currency: "usd" }),
    );
    expect(mocks.markLateFeeCharged).toHaveBeenCalledWith(
      "test",
      "sess_1",
      25,
    );
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
    mocks.restore();
  });

  it("returns early for sale shops without scheduling", async () => {
    const { setupLateFeeTest } = await import("./helpers/lateFee");
    const mocks = await setupLateFeeTest({
      orders: [],
      shop: { type: "sale" },
    });
    mocks.readFile.mockImplementation((path: string) => {
      if (path.endsWith("settings.json"))
        return Promise.resolve(
          JSON.stringify({
            lateFeeService: { enabled: true, intervalMinutes: 1 },
          }),
        );
      if (path.endsWith("shop.json"))
        return Promise.resolve(JSON.stringify({ type: "sale" }));
      return Promise.reject(new Error("not found"));
    });
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const mod = await import("../src/lateFeeService");
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);
    const clearSpy = jest
      .spyOn(global, "clearInterval")
      .mockImplementation(() => undefined as any);

    const stop = await mod.startLateFeeService();

    expect(mocks.readOrders).not.toHaveBeenCalled();
    expect(mocks.stripeCharge).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();

    stop();
    setSpy.mockRestore();
    clearSpy.mockRestore();
    mocks.restore();
  });

  it("propagates readdir errors without scheduling", async () => {
    const err = new Error("boom");
    const readdir = jest.fn().mockRejectedValue(err);
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile: jest.fn(),
    }));

    const mod = await import("../src/lateFeeService");
    const setSpy = jest
      .spyOn(global, "setInterval")
      .mockImplementation(() => 111 as any);

    await expect(mod.startLateFeeService()).rejects.toBe(err);
    expect(setSpy).not.toHaveBeenCalled();

    setSpy.mockRestore();
  });
});
