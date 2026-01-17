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
    jest.doMock("@acme/platform-core/dataRoot", () => ({
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
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
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
});

