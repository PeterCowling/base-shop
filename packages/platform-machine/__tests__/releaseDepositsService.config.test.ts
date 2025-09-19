import {
  resetReleaseDepositsEnv,
  restoreOriginalEnv,
  readdir,
  readFile,
  readOrders,
} from "./helpers/releaseDepositsSetup";

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReleaseDepositsEnv();
});

afterEach(() => {
  restoreOriginalEnv();
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
    delete process.env.DEPOSIT_RELEASE_INTERVAL_MS_SHOP1;
  });
});
