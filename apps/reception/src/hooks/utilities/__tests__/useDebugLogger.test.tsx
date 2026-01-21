import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import { useDebugLogger } from "../useDebugLogger";

// Reference lines 1-12 of useDebugLogger.ts

describe("useDebugLogger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("logs label and updated data in development", () => {
    process.env.NODE_ENV = "development";
    const spy = jest.spyOn(console, "debug").mockImplementation(() => undefined);

    const { rerender } = renderHook(
      ({ value }) => {
        useDebugLogger("test", value);
      },
      { initialProps: { value: 1 } }
    );

    spy.mockClear();

    rerender({ value: 2 });

    expect(spy).toHaveBeenCalledWith("[DEBUG] test:", 2);

    spy.mockRestore();
  });

  it("does not log in production", () => {
    process.env.NODE_ENV = "production";
    const spy = jest.spyOn(console, "debug").mockImplementation(() => undefined);

    const { rerender } = renderHook(
      ({ value }) => {
        useDebugLogger("test", value);
      },
      { initialProps: { value: 1 } }
    );

    spy.mockClear();

    rerender({ value: 2 });

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
