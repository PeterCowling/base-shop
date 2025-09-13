import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("requireEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws when variable is undefined", async () => {
    await withEnv({}, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
    });
  });

  it("throws when variable is empty", async () => {
    await withEnv({ EMPTY: "   " }, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("EMPTY")).toThrow("EMPTY is required");
    });
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

  it("throws when boolean variable is missing or blank", async () => {
    await withEnv({ BOOL: "  " }, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("BOOL", "boolean")).toThrow(
        "BOOL is required",
      );
    });
    await withEnv({}, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("BOOL", "boolean")).toThrow(
        "BOOL is required",
      );
    });
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

  it("throws when number variable is missing or blank", async () => {
    await withEnv({ NUM: " \t" }, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("NUM", "number")).toThrow(
        "NUM is required",
      );
    });
    await withEnv({}, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(() => requireEnv("NUM", "number")).toThrow(
        "NUM is required",
      );
    });
  });

  it("throws for invalid boolean and number", async () => {
    await withEnv(
      {
        BAD_BOOL: "yes",
        BAD_NUM: "forty",
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

  it("returns trimmed string by default", async () => {
    await withEnv({ NAME: "  value  " }, async () => {
      const { requireEnv } = await import("../src/env/core");
      expect(requireEnv("NAME")).toBe("value");
    });
  });
});
