describe("resolveConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: {
        checkout: { sessions: { retrieve: jest.fn() } },
        paymentIntents: { create: jest.fn() },
      },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("uses file defaults", async () => {
    const readFile = jest
      .fn()
      .mockResolvedValue(
        JSON.stringify({
          lateFeeService: { enabled: true, intervalMinutes: 5 },
        })
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
    const readFile = jest
      .fn()
      .mockResolvedValue(
        JSON.stringify({
          lateFeeService: { enabled: true, intervalMinutes: 1 },
        })
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

  it("uses core interval when env var is invalid", async () => {
    process.env.LATE_FEE_INTERVAL_MS_SHOP = "abc";
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
      coreEnv: { LATE_FEE_INTERVAL_MS: 180000 },
      loadCoreEnv: () => ({ LATE_FEE_INTERVAL_MS: 180000 }),
    }));

    const mod = await import("../src/lateFeeService");
    const cfg = await mod.resolveConfig("shop", "/data");

    expect(cfg).toEqual({ enabled: false, intervalMinutes: 3 });

    delete process.env.LATE_FEE_INTERVAL_MS_SHOP;
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
