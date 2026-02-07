import { describe, expect, it, jest } from "@jest/globals";

import { register } from "../../instrumentation";

const captureError = jest.fn();

jest.mock("@acme/telemetry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

describe("instrumentation", () => {
  it("registers process handlers", async () => {
    const handlers: Record<string, (arg: unknown) => void> = {};
    const onSpy = jest
      .spyOn(process, "on")
      .mockImplementation((event, handler) => {
        handlers[event.toString()] = handler as (arg: unknown) => void;
        return process;
      });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await register();

    expect(handlers.uncaughtException).toBeDefined();
    expect(handlers.unhandledRejection).toBeDefined();

    handlers.uncaughtException?.(new Error("boom"));
    handlers.unhandledRejection?.("bad");

    expect(captureError).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    onSpy.mockRestore();
  });
});
