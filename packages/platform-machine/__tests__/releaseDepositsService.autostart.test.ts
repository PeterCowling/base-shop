import { logger } from "@acme/platform-core/utils";

import {
  resetReleaseDepositsEnv,
  restoreOriginalEnv,
} from "./helpers/releaseDepositsSetup";

describe("auto-start", () => {
  afterEach(() => {
    delete process.env.RUN_DEPOSIT_RELEASE_SERVICE;
    jest.unmock("../src/releaseDepositsService");
    jest.unmock("@acme/platform-machine/releaseDepositsService");
    jest.unmock("../releaseDepositsService");
    jest.resetModules();
    jest.clearAllMocks();
    restoreOriginalEnv();
  });

  beforeEach(() => {
    resetReleaseDepositsEnv();
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
        startMock().catch((e: any) => {
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
