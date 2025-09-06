import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("requireEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("converts boolean strings", async () => {
    await withEnv(
      {
        BOOL_TRUE: "true",
        BOOL_ONE: "1",
        BOOL_FALSE: "false",
        BOOL_ZERO: "0",
      },
      async () => {
        const { requireEnv } = await import("../src/env/core");
        expect(requireEnv("BOOL_TRUE", "boolean")).toBe(true);
        expect(requireEnv("BOOL_ONE", "boolean")).toBe(true);
        expect(requireEnv("BOOL_FALSE", "boolean")).toBe(false);
        expect(requireEnv("BOOL_ZERO", "boolean")).toBe(false);
      }
    );
  });

  it("converts number strings", async () => {
    await withEnv(
      {
        NUMERIC: "42",
      },
      async () => {
        const { requireEnv } = await import("../src/env/core");
        expect(requireEnv("NUMERIC", "number")).toBe(42);
      }
    );
  });

  it("throws for invalid boolean and number", async () => {
    await withEnv(
      {
        BAD_BOOL: "yes",
        BAD_NUM: "abc",
      },
      async () => {
        const { requireEnv } = await import("../src/env/core");
        expect(() => requireEnv("BAD_BOOL", "boolean")).toThrow(
          "BAD_BOOL must be a boolean"
        );
        expect(() => requireEnv("BAD_NUM", "number")).toThrow(
          "BAD_NUM must be a number"
        );
      }
    );
  });
});
