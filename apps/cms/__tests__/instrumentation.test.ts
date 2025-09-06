import { describe, it, beforeEach, afterEach, expect, jest } from "@jest/globals";
import { register } from "../instrumentation";

describe("instrumentation register (browser)", () => {
  let processOnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  const handlers: Record<string, (...args: unknown[]) => void> = {};

  beforeEach(() => {
    processOnSpy = jest
      .spyOn(process, "on")
      .mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
        handlers[event] = handler;
        return process;
      });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const key of Object.keys(handlers)) delete handlers[key];
  });

  it("attaches handlers for uncaughtException and unhandledRejection", async () => {
    await register();
    expect(processOnSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
  });

  it("logs errors using console.error", async () => {
    await register();
    const err = new Error("boom");
    const rejection = new Error("fail");
    handlers["uncaughtException"]?.(err);
    handlers["unhandledRejection"]?.(rejection);
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(
      1,
      "[instrumentation] uncaughtException\n",
      err.stack ?? err,
    );
    expect(consoleErrorSpy).toHaveBeenNthCalledWith(
      2,
      "[instrumentation] unhandledRejection\n",
      rejection.stack ?? rejection,
    );
  });
});
