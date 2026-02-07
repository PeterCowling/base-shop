import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { register } from "../instrumentation";

type MockSpyInstance = jest.SpyInstance<any, any>;

describe("instrumentation register (browser)", () => {
  let processOnSpy: MockSpyInstance;
  let consoleErrorSpy: MockSpyInstance;
  let consoleLogSpy: MockSpyInstance;
  const handlers: Record<string, (...args: unknown[]) => void> = {};

  beforeEach(() => {
    processOnSpy = jest
      .spyOn(process, "on")
      .mockImplementation(((event: string, handler: (...args: unknown[]) => void) => {
        handlers[event] = handler;
        return process;
      }) as any) as unknown as MockSpyInstance;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {}) as unknown as MockSpyInstance;
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {}) as unknown as MockSpyInstance;
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
