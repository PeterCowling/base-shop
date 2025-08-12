import { expect } from "@jest/globals";

jest.mock("node:fs", () => {
  const actual = jest.requireActual("node:fs") as typeof import("node:fs");
  return {
    ...actual,
    existsSync: jest.fn(actual.existsSync),
    readFileSync: jest.fn(actual.readFileSync),
  };
});

let existsSyncMock = require("node:fs").existsSync as jest.Mock;
let readFileSyncMock = require("node:fs").readFileSync as jest.Mock;

describe("validate-env script", () => {
  const ORIGINAL_ARGV = process.argv;

  beforeEach(() => {
    jest.resetModules();
    process.argv = ["node", "validate-env", "abc"];
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CART_COOKIE_SECRET = "secret";
    existsSyncMock = require("node:fs").existsSync as jest.Mock;
    readFileSyncMock = require("node:fs").readFileSync as jest.Mock;
    existsSyncMock.mockReset();
    readFileSyncMock.mockReset();
  });

  afterEach(() => {
    process.argv = ORIGINAL_ARGV;
    jest.restoreAllMocks();
  });

  it("exits 0 and logs success for valid env", async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(
      "STRIPE_SECRET_KEY=sk\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk\nCART_COOKIE_SECRET=secret\n"
    );

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);

    await import("../../dist-scripts/validate-env.js");

    expect(logSpy).toHaveBeenCalledWith("Environment variables look valid.");
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("exits 1 and reports invalid env", async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(
      "STRIPE_SECRET_KEY=sk\nCART_COOKIE_SECRET=secret\n"
    );

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);

    await import("../../dist-scripts/validate-env.js").catch(() => {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy.mock.calls[0][0]).toBe(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required",
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("exits 1 when .env file is missing", async () => {
    existsSyncMock.mockReturnValue(false);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);

    await import("../../dist-scripts/validate-env.js").catch(() => {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith("Missing apps/shop-abc/.env");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("exits 1 for invalid DEPOSIT_RELEASE values", async () => {
    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(
      "STRIPE_SECRET_KEY=sk\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk\nCART_COOKIE_SECRET=secret\nDEPOSIT_RELEASE_ENABLED=maybe\nDEPOSIT_RELEASE_INTERVAL_MS=foo\n",
    );

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);

    await import("../../dist-scripts/validate-env.js").catch(() => {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy.mock.calls).toEqual([
      ["DEPOSIT_RELEASE_ENABLED must be true or false"],
      ["DEPOSIT_RELEASE_INTERVAL_MS must be a number"],
    ]);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
