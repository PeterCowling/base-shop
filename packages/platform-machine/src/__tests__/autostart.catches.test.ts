/** @jest-environment node */
import type { Mock } from "jest-mock";

describe("autostart catch logging", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock("fs/promises");
    jest.unmock("node:fs/promises");
    jest.unmock("@acme/platform-core/utils");
  });

  const flush = () => new Promise((r) => setImmediate(r));

  it("logs when reverse logistics autostart fails", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const err = new Error("boom");

    const readdir = jest.fn().mockRejectedValue(err);
    jest.doMock("fs/promises", () => ({ __esModule: true, readdir }));

    const error: Mock = jest.fn();
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));

    await import("../startReverseLogisticsService");
    await flush();

    expect(error).toHaveBeenCalledWith(
      "failed to start reverse logistics service",
      { err },
    );
  });

  it("logs when late fee service autostart fails", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const err = new Error("boom");

    const readdir = jest.fn().mockRejectedValue(err);
    const readFile = jest.fn();
    jest.doMock("fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile,
    }));

    const error: Mock = jest.fn();
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));

    await import("../lateFeeService");
    await flush();

    expect(error).toHaveBeenCalledWith(
      "failed to start late fee service",
      { err },
    );
  });

  it("logs when deposit release autostart fails", async () => {
    process.env.RUN_DEPOSIT_RELEASE_SERVICE = "true";
    const err = new Error("boom");

    const readdir = jest.fn().mockRejectedValue(err);
    const readFile = jest.fn();
    jest.doMock("node:fs/promises", () => ({
      __esModule: true,
      readdir,
      readFile,
    }));

    const error: Mock = jest.fn();
    const cerror: Mock = jest.fn();
    jest.doMock("@acme/platform-core/utils", () => ({
      __esModule: true,
      logger: { error, info: jest.fn() },
    }));
    jest.spyOn(console, "error").mockImplementation(cerror);

    await import("../releaseDepositsService");
    await flush();

    expect(error).toHaveBeenCalledWith(
      "failed to start deposit release service",
      { err },
    );
    expect(cerror).toHaveBeenCalledWith(
      "failed to start deposit release service",
      err,
    );
  });
});
