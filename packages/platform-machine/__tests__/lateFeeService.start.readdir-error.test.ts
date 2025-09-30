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

