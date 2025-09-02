describe("chargeLateFeesOnce", () => {
  it("continues when shop policy cannot be loaded", async () => {
    const { setupLateFeeTest } = await import("./helpers/lateFee");
    const mocks = await setupLateFeeTest({ orders: [] });
    mocks.readFile.mockRejectedValue(new Error("no policy"));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const { chargeLateFeesOnce } = await import("../src/lateFeeService");
    try {
      await chargeLateFeesOnce();
    } finally {
      mocks.restore();
    }

    expect(mocks.readOrders).not.toHaveBeenCalled();
  });
});

describe("resolveConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("uses file defaults", async () => {
    const readFile = jest.fn().mockResolvedValue(
      JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 5 } }),
    );
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error: jest.fn(), info: jest.fn() },
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(readFile).toHaveBeenCalledWith("/data/shop/settings.json", "utf8");
    expect(cfg).toEqual({ enabled: true, intervalMinutes: 5 });
  });

  it("overrides with environment variables", async () => {
    process.env.LATE_FEE_ENABLED_SHOP = "false";
    const readFile = jest.fn().mockResolvedValue(
      JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 1 } }),
    );
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error: jest.fn(), info: jest.fn() },
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: { LATE_FEE_INTERVAL_MS: 120000 },
      loadCoreEnv: () => ({ LATE_FEE_INTERVAL_MS: 120000 }),
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(cfg).toEqual({ enabled: false, intervalMinutes: 2 });

    delete process.env.LATE_FEE_ENABLED_SHOP;
  });

  it("falls back to core env values", async () => {
    const readFile = jest.fn().mockResolvedValue("{}");
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error: jest.fn(), info: jest.fn() },
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: { LATE_FEE_ENABLED: true, LATE_FEE_INTERVAL_MS: 180000 },
      loadCoreEnv: () => ({
        LATE_FEE_ENABLED: true,
        LATE_FEE_INTERVAL_MS: 180000,
      }),
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(cfg).toEqual({ enabled: true, intervalMinutes: 3 });
  });

  it("applies passed overrides", async () => {
    const readFile = jest.fn().mockResolvedValue("{}");
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readFile,
      readdir: jest.fn(),
    }));
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error: jest.fn(), info: jest.fn() },
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data", {
      enabled: true,
      intervalMinutes: 2,
    });

    expect(cfg).toEqual({ enabled: true, intervalMinutes: 2 });
  });
});

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
          JSON.stringify({ lateFeeService: { enabled: false } }),
        );
      if (path.endsWith("b/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 1 } }),
        );
      if (path.endsWith("b/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } }),
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
    expect(paths.filter((p) => p.includes("b/shop.json")).length).toBeGreaterThan(0);
    expect(setSpy).toHaveBeenCalledTimes(1);

    stop();
    expect(clearSpy).toHaveBeenCalledWith(111 as any);

    setSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it("logs errors from chargeLateFeesOnce", async () => {
    const readdir = jest.fn().mockResolvedValue(["shop"]);
    const readFile = jest.fn().mockImplementation((path: string) => {
      if (path.endsWith("shop/settings.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 1 } }),
        );
      if (path.endsWith("shop/shop.json"))
        return Promise.resolve(
          JSON.stringify({ lateFeePolicy: { feeAmount: 5 } }),
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
          JSON.stringify({ lateFeeService: { enabled: true, intervalMinutes: 1 } }),
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
});

describe("auto-start", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NODE_ENV: "production" } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("logs errors when service fails to start", async () => {
    const err = new Error("boom");
    const readdir = jest.fn().mockRejectedValue(err);
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile: jest.fn(),
    }));
    const error = jest.fn();
    jest.doMock("@platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));
    jest.doMock("@acme/config/env/core", () => ({
      __esModule: true,
      coreEnv: {},
      loadCoreEnv: () => ({}),
    }));

    await import("../src/lateFeeService");
    await new Promise((r) => setTimeout(r, 0));

    expect(error).toHaveBeenCalledWith("failed to start late fee service", { err });
  });
});
