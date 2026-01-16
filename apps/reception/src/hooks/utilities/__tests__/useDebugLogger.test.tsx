import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

import { useDebugLogger } from "../useDebugLogger";

// Reference lines 1-12 of useDebugLogger.ts

describe("useDebugLogger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("logs label and updated data in development", () => {
    process.env.NODE_ENV = "development";
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);

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
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);

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
